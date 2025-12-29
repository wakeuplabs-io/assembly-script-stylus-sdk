import { ChildProcess, exec, spawn } from "child_process";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface LocalNodeConfig {
  port?: number;
  chainId?: number;
  verbose?: boolean; // SDK-level logs (setup, deployment, etc)
  dockerVerbose?: boolean; // Docker container logs (Nitro node output)
  dockerImage?: string;
}

// Get default image from env or use default
const getDefaultImage = (): string => {
  return process.env.NITRO_NODE_IMAGE || "offchainlabs/nitro-node:v3.9.4-7f582c3";
};

const DEFAULT_CONFIG: Required<LocalNodeConfig> = {
  port: 42424, // Uncommon port to avoid conflicts with user's Nitro nodes
  chainId: 412346,
  verbose: false, // SDK logs off by default
  dockerVerbose: false, // Docker logs off by default
  dockerImage: getDefaultImage(),
};

export class LocalNodeManager {
  private nodeProcess: ChildProcess | null = null;
  private config: Required<LocalNodeConfig>;
  private isDockerNode = false;
  private dataDir: string;
  private containerName: string;

  constructor(config: LocalNodeConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Use OS temp dir with as-stylus-specific subdirectory (per port to avoid clashes)
    this.dataDir = path.join(tmpdir(), `as-stylus-test-node-data-${this.config.port}`);
    // Container name per port (or env override)
    const envName = process.env.NITRO_NODE_CONTAINER_NAME;
    this.containerName =
      envName && envName.trim().length > 0 ? envName : `as-stylus-testnode-${this.config.port}`;
  }

  /**
   * Checks if Docker is available on the system
   */
  private async isDockerAvailable(): Promise<boolean> {
    try {
      await execAsync("docker --version");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if the port is already in use
   */
  private async isPortInUse(port: number): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        process.platform === "win32"
          ? `netstat -ano | findstr :${port}`
          : `lsof -i :${port} || netstat -an | grep ${port}`,
      );
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Waits for the node to be ready by polling the RPC endpoint
   * Increased timeout to 3 minutes to account for Docker image download on first run
   */
  private async waitForNode(timeoutMs = 180000): Promise<void> {
    const startTime = Date.now();
    const rpcUrl = `http://localhost:${this.config.port}`;

    if (this.config.verbose) {
      console.log(`⏳ Waiting for node to be ready (may take a few minutes on first run)...`);
    }

    let lastProgressLog = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_chainId",
            params: [],
            id: 1,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            if (this.config.verbose) {
              console.log(`✅ Local node ready at ${rpcUrl}`);
              console.log(`   Chain ID: ${data.result}`);
            }
            return;
          }
        }
      } catch (error) {
        // Node not ready yet, continue polling
        // Show progress every 30 seconds
        const elapsed = Date.now() - startTime;
        if (this.config.verbose && elapsed - (lastProgressLog - startTime) >= 30000) {
          console.log(`   Still waiting... (${Math.floor(elapsed / 1000)}s elapsed)`);
          lastProgressLog = Date.now();
        }
      }

      // Wait 1 second before next attempt
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    throw new Error(
      `Local node did not become ready within ${elapsedSeconds}s. Possible causes:\n` +
        `  1. Docker image still downloading (check: docker images | grep nitro-node)\n` +
        `  2. Docker daemon not running\n` +
        `  3. Port ${this.config.port} occupied\n` +
        `  4. Container failed to start\n\n` +
        `Check container logs: docker logs ${this.containerName}`,
    );
  }

  /**
   * Starts a local Nitro node using Docker in --dev mode
   */
  private async startDockerNode(): Promise<void> {
    if (this.config.verbose) {
      console.log(`🐳 Starting Nitro node with Docker (dev mode)...`);
      console.log(`   Image: ${this.config.dockerImage}`);
      console.log(`   Port: ${this.config.port}`);
    }

    // Check if container already exists and clean up data directory
    try {
      await execAsync(`docker rm -f ${this.containerName} 2>/dev/null || true`);
      await execAsync(`rm -rf ${this.dataDir} && mkdir -p ${this.dataDir}`);
    } catch {
      // Ignore errors
    }

    // Start the container with --dev mode for Stylus testing
    const dockerArgs = [
      "run",
      "--rm",
      "--name",
      this.containerName,
      "-p",
      `${this.config.port}:8547`,
      "-v",
      `${this.dataDir}:/tmp/dev-test`,
      this.config.dockerImage,
      "--dev",
      "--http.addr",
      "0.0.0.0",
      "--http.api=net,web3,eth,debug",
    ];

    this.nodeProcess = spawn("docker", dockerArgs, {
      stdio: this.config.dockerVerbose ? "inherit" : "ignore",
      detached: false,
    });

    this.isDockerNode = true;

    return new Promise((resolve, reject) => {
      if (!this.nodeProcess) {
        reject(new Error("Failed to start node process"));
        return;
      }

      this.nodeProcess.on("error", (error) => {
        reject(new Error(`Failed to start Docker node: ${error.message}`));
      });

      // Give Docker a moment to start, then check if it's running
      setTimeout(() => {
        if (this.nodeProcess && !this.nodeProcess.killed) {
          resolve();
        } else {
          reject(new Error("Docker node process terminated unexpectedly"));
        }
      }, 3000);
    });
  }

  /**
   * Checks if we're running in Jest watch mode
   */
  private isWatchMode(): boolean {
    return process.argv.includes("--watch") || process.argv.includes("--watchAll");
  }

  /**
   * Restarts the Docker container to reset state
   */
  private async restartDockerNode(): Promise<void> {
    if (this.config.verbose) {
      console.log(`♻️  Restarting test node (watch mode)...`);
    }

    try {
      await execAsync(`docker restart ${this.containerName} 2>/dev/null`);
      // Wait for node to be ready after restart
      await this.waitForNode();
    } catch (error) {
      throw new Error(`Failed to restart Docker node: ${error}`);
    }
  }

  /**
   * Starts the local node
   * Automatically detects if Docker is available and uses it,
   * otherwise provides instructions for manual setup
   *
   * In watch mode, restarts existing node if port is in use
   */
  async start(): Promise<void> {
    // Check if port is already in use
    const portInUse = await this.isPortInUse(this.config.port);
    if (portInUse) {
      // In watch mode with default port, restart existing node
      const isWatch = this.isWatchMode();
      if (isWatch && this.config.port === DEFAULT_CONFIG.port) {
        await this.restartDockerNode();
        this.isDockerNode = true;
        return;
      }

      // If it's our default test port and NOT watch mode, clean up the old container
      if (this.config.port === DEFAULT_CONFIG.port) {
        if (this.config.verbose) {
          console.log(
            `⚠️  Default test port ${this.config.port} is in use. Cleaning up old test container...`,
          );
        }
        try {
          await execAsync(`docker stop ${this.containerName} 2>/dev/null || true`);
          await execAsync(`docker rm ${this.containerName} 2>/dev/null || true`);
          // Wait a moment for port to be released
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Check again if port is still in use
          const stillInUse = await this.isPortInUse(this.config.port);
          if (stillInUse) {
            throw new Error(`
❌ Port ${this.config.port} is still in use after cleanup attempt.

Please manually stop the process using port ${this.config.port} and try again.
            `);
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes("still in use")) {
            throw error;
          }
          // If cleanup failed for other reasons, continue
        }
      } else {
        // Custom port - user should handle it
        throw new Error(`
❌ Port ${this.config.port} is already in use.

Please either:
1. Stop the process using port ${this.config.port}
2. Specify a different port in setupLocal() config:

   setupLocal({
     ...options,
     nodeConfig: { port: <different-port> }
   })
        `);
      }
    }

    // Check if Docker is available
    const hasDocker = await this.isDockerAvailable();

    if (hasDocker) {
      await this.startDockerNode();
      await this.waitForNode();
    } else {
      throw new Error(
        `❌ Cannot start local Nitro node automatically.\n\nDocker is not available on this system. Please install Docker and run tests again.`,
      );
    }
  }

  /**
   * Stops the local node
   * In watch mode, keeps the node running for reuse
   */
  async stop(): Promise<void> {
    // In watch mode, don't stop the container - keep it running for reuse
    if (this.isWatchMode()) {
      if (this.config.verbose) {
        console.log("⏸️  Keeping node running for watch mode");
      }
      return;
    }

    if (!this.nodeProcess) {
      return;
    }

    if (this.config.verbose) {
      console.log("🛑 Stopping local node...");
    }

    if (this.isDockerNode) {
      // Stop Docker container and clean up data directory
      try {
        await execAsync(`docker stop ${this.containerName} 2>/dev/null || true`);
        await execAsync(`rm -rf ${this.dataDir} 2>/dev/null || true`);
      } catch {
        // Ignore errors
      }
    } else if (this.nodeProcess) {
      // Kill the process
      this.nodeProcess.kill("SIGTERM");

      // Wait for graceful shutdown
      await new Promise((resolve) => {
        setTimeout(resolve, 2000);
      });

      // Force kill if still running
      if (!this.nodeProcess.killed) {
        this.nodeProcess.kill("SIGKILL");
      }
    }

    this.nodeProcess = null;

    if (this.config.verbose) {
      console.log("✅ Local node stopped");
    }
  }

  /**
   * Gets the RPC URL for the local node
   */
  getRpcUrl(): string {
    return `http://localhost:${this.config.port}`;
  }

  /**
   * Gets the chain ID for the local node
   */
  getChainId(): number {
    return this.config.chainId;
  }
}
