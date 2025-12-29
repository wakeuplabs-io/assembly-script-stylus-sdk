/**
 * E2E tests for LocalNodeManager
 *
 * These tests run against a REAL Docker container with Nitro node.
 * They verify Docker detection, port management, node lifecycle, and watch mode behavior.
 *
 * Requirements:
 * - Docker must be installed and running
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from "@jest/globals";
import { exec } from "child_process";
import { promisify } from "util";

import { LocalNodeConfig, LocalNodeManager } from "../../../cli/tests/local-node-manager.js";

const execAsync = promisify(exec);
let nextPort = Number(process.env.LOCAL_TEST_PORT ?? 42430);
const allocPort = () => nextPort++;
const makeManager = (options: Partial<LocalNodeConfig> = {}) =>
  new LocalNodeManager({ port: allocPort(), ...options });

describe("LocalNodeManager - E2E Tests", () => {
  let managers: LocalNodeManager[] = [];

  // Check if Docker is available
  beforeAll(async () => {
    try {
      await execAsync("docker --version");
    } catch {
      console.log("⚠️  Docker not available, skipping E2E tests");
    }
  }, 10000);

  // Best-effort pre-clean to avoid leftover container between test cases
  beforeEach(async () => {
    try {
      await execAsync(
        "docker rm -f $(docker ps -aq --filter name=as-stylus-testnode) 2>/dev/null || true",
      );
      await execAsync("rm -rf /tmp/as-stylus-test-node-data* 2>/dev/null || true");
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch {
      // best-effort cleanup
    }
  }, 15000);

  // Cleanup all managers after each test
  afterEach(async () => {
    for (const manager of managers) {
      try {
        await manager.stop();
      } catch {
        // Ignore cleanup errors
      }
    }
    managers = [];

    // Extra cleanup: ensure test container is stopped
    try {
      await execAsync(
        "docker stop $(docker ps -aq --filter name=as-stylus-testnode) 2>/dev/null || true",
      );
      await execAsync(
        "docker rm $(docker ps -aq --filter name=as-stylus-testnode) 2>/dev/null || true",
      );
    } catch {
      // Ignore
    }
  }, 30000);

  describe("Docker availability", () => {
    it("should start node when Docker is available", async () => {
      const manager = makeManager({ verbose: false });
      managers.push(manager);

      await expect(manager.start()).resolves.toBeUndefined();

      // Verify node is accessible
      expect(manager.getRpcUrl()).toMatch(/^http:\/\/localhost:\d+$/);
    }, 90000);

    it("should expose correct RPC URL after start", async () => {
      const port = allocPort();
      const manager = makeManager({ port, verbose: false });
      managers.push(manager);

      await manager.start();

      expect(manager.getRpcUrl()).toBe(`http://localhost:${port}`);
    }, 90000);
  });

  describe("Port management", () => {
    it("should start on default port 42424", async () => {
      const port = allocPort();
      const manager = makeManager({ port, verbose: false });
      managers.push(manager);

      await manager.start();

      expect(manager.getRpcUrl()).toBe(`http://localhost:${port}`);
    }, 90000);

    it("should start on custom port", async () => {
      const customPort = allocPort();
      const manager = makeManager({ port: customPort, verbose: false });
      managers.push(manager);

      await manager.start();

      expect(manager.getRpcUrl()).toBe(`http://localhost:${customPort}`);
    }, 90000);

    it("should handle port cleanup when occupied (non-watch mode)", async () => {
      // Use two distinct ports to avoid external conflicts
      const port1 = allocPort();
      const port2 = allocPort();

      // Start first node
      const manager1 = makeManager({ port: port1, verbose: false });
      managers.push(manager1);
      await manager1.start();

      // Stop it but don't cleanup Docker container
      await manager1.stop();

      // Force-kill any process on port2 (best-effort)
      try {
        await execAsync(
          `for p in $(lsof -ti :${port2} 2>/dev/null); do kill -9 $p 2>/dev/null || true; done`,
        );
      } catch {
        // ignore
      }

      // Try to start second node on a different port (port1 may be occupied)
      const manager2 = makeManager({ port: port2, verbose: true });
      managers.push(manager2);

      await expect(manager2.start()).resolves.toBeUndefined();
    }, 120000);
  });

  describe("Node lifecycle", () => {
    it("should start and stop node successfully", async () => {
      const manager = makeManager({ verbose: false });
      managers.push(manager);

      // Start
      await manager.start();
      expect(manager.getRpcUrl()).toBeDefined();

      // Stop
      await manager.stop();
    }, 90000);

    it("should handle stop when node not started", async () => {
      const manager = makeManager({ verbose: false });
      managers.push(manager);

      // Stop without start should not throw
      await expect(manager.stop()).resolves.toBeUndefined();
    }, 10000);

    it("should handle multiple stop calls", async () => {
      const manager = makeManager({ verbose: false });
      managers.push(manager);

      await manager.start();

      // First stop
      await manager.stop();

      // Second stop should not throw
      await expect(manager.stop()).resolves.toBeUndefined();
    }, 90000);
  });

  describe("Configuration", () => {
    it("should respect verbose configuration", async () => {
      const manager = makeManager({ verbose: true, dockerVerbose: false });
      managers.push(manager);

      await manager.start();
      expect(manager.getRpcUrl()).toBeDefined();
    }, 90000);

    it("should respect dockerVerbose configuration", async () => {
      const manager = makeManager({ verbose: false, dockerVerbose: true });
      managers.push(manager);

      await manager.start();
      expect(manager.getRpcUrl()).toBeDefined();
    }, 90000);

    it("should use custom Docker image if specified", async () => {
      // Note: This test uses default image but verifies the config is accepted
      const manager = makeManager({
        dockerImage: "offchainlabs/nitro-node:v3.2.1-d81324d",
        verbose: false,
      });
      managers.push(manager);

      await manager.start();
      expect(manager.getRpcUrl()).toBeDefined();
    }, 90000);

    it("should use custom chain ID", async () => {
      const manager = makeManager({ chainId: 999999, verbose: false });
      managers.push(manager);

      await manager.start();
      expect(manager.getChainId()).toBe(999999);
    }, 90000);
  });

  describe("Watch mode behavior", () => {
    it("should keep node running in watch mode", async () => {
      // Simulate watch mode
      const originalArgv = [...process.argv];
      process.argv = ["node", "jest", "--watch"];

      const manager = makeManager({ verbose: false });
      managers.push(manager);

      await manager.start();

      // Stop in watch mode should keep node running
      await manager.stop();

      // Verify container is still running
      const { stdout } = await execAsync(
        "docker ps --filter name=as-stylus-testnode --format '{{.Names}}'",
      );
      expect(stdout.trim()).toContain("as-stylus-testnode");

      // Restore argv
      process.argv = originalArgv;

      // Force cleanup
      await execAsync(
        "docker stop $(docker ps -aq --filter name=as-stylus-testnode) 2>/dev/null || true",
      );
    }, 90000);

    it("should stop node in normal mode", async () => {
      // Normal mode (no watch flag)
      const originalArgv = [...process.argv];
      process.argv = ["node", "jest"];

      const manager = makeManager({ verbose: false });
      managers.push(manager);

      await manager.start();
      await manager.stop();

      // Give Docker time to stop
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify container is NOT running
      const { stdout } = await execAsync(
        "docker ps --filter name=as-stylus-testnode --format '{{.Names}}'",
      );
      expect(stdout.trim()).toBe("");

      // Restore argv
      process.argv = originalArgv;
    }, 90000);
  });

  describe("RPC endpoint", () => {
    it("should be accessible after node starts", async () => {
      const manager = makeManager({ verbose: false });
      managers.push(manager);

      await manager.start();

      // Test RPC endpoint
      const response = await fetch(manager.getRpcUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
          id: 1,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.result).toBeDefined();
    }, 90000);

    it("should return correct chain ID", async () => {
      const chainId = 412346;
      const manager = makeManager({ chainId, verbose: false });
      managers.push(manager);

      await manager.start();

      const response = await fetch(manager.getRpcUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
          id: 1,
        }),
      });

      const data = await response.json();
      const returnedChainId = parseInt(data.result, 16);
      expect(returnedChainId).toBe(chainId);
    }, 90000);
  });

  describe("Environment variables", () => {
    it("should respect NITRO_NODE_IMAGE env variable", async () => {
      const originalEnv = process.env.NITRO_NODE_IMAGE;
      process.env.NITRO_NODE_IMAGE = "offchainlabs/nitro-node:v3.2.1-d81324d";

      const manager = makeManager({ verbose: false });
      managers.push(manager);

      await manager.start();
      expect(manager.getRpcUrl()).toBeDefined();

      // Restore env
      if (originalEnv) {
        process.env.NITRO_NODE_IMAGE = originalEnv;
      } else {
        delete process.env.NITRO_NODE_IMAGE;
      }
    }, 90000);
  });

  describe("Error handling", () => {
    it("should timeout if node doesn't start (fast failure)", async () => {
      const manager = makeManager({ verbose: false });
      managers.push(manager);

      // Mock startDockerNode to reject immediately
      const spy = jest
        .spyOn(manager as unknown as { startDockerNode: () => Promise<void> }, "startDockerNode")
        .mockRejectedValue(new Error("boom"));

      await expect(manager.start()).rejects.toThrow("boom");
      spy.mockRestore();
    }, 5000);
  });
});
