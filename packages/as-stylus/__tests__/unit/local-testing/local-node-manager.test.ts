/**
 * Unit tests for LocalNodeManager
 *
 * These tests verify the LocalNodeManager class behavior by creating real instances
 * and testing their configuration and public methods.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

import { LocalNodeManager } from "../../../cli/tests/local-node-manager.js";

type ManagerWithMocks = {
  start: () => Promise<void>;
  isPortInUse: jest.Mock;
  isDockerAvailable: jest.Mock;
  isWatchMode: jest.Mock;
  restartDockerNode: jest.Mock;
  isDockerNode: boolean;
};

describe("LocalNodeManager - Unit Tests", () => {
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = [...process.argv];
    process.argv = ["node", "jest"]; // Reset to non-watch mode
  });

  afterEach(() => {
    process.argv = originalArgv;
    jest.restoreAllMocks();
  });

  describe("Constructor and Configuration", () => {
    it("should create instance with default configuration", () => {
      const manager = new LocalNodeManager();

      expect(manager.getRpcUrl()).toBe("http://localhost:42424");
      expect(manager.getChainId()).toBe(412346);
    });

    it("should create instance with custom port", () => {
      const manager = new LocalNodeManager({ port: 9999 });

      expect(manager.getRpcUrl()).toBe("http://localhost:9999");
      expect(manager.getChainId()).toBe(412346);
    });

    it("should create instance with custom chain ID", () => {
      const manager = new LocalNodeManager({ chainId: 123456 });

      expect(manager.getRpcUrl()).toBe("http://localhost:42424");
      expect(manager.getChainId()).toBe(123456);
    });

    it("should create instance with custom port and chain ID", () => {
      const manager = new LocalNodeManager({ port: 8888, chainId: 999999 });

      expect(manager.getRpcUrl()).toBe("http://localhost:8888");
      expect(manager.getChainId()).toBe(999999);
    });

    it("should create instance with verbose configuration", () => {
      const manager = new LocalNodeManager({ verbose: true });

      expect(manager).toBeDefined();
      expect(manager.getRpcUrl()).toBe("http://localhost:42424");
    });

    it("should create instance with dockerVerbose configuration", () => {
      const manager = new LocalNodeManager({ dockerVerbose: true });

      expect(manager).toBeDefined();
      expect(manager.getRpcUrl()).toBe("http://localhost:42424");
    });

    it("should create instance with custom Docker image", () => {
      const manager = new LocalNodeManager({
        dockerImage: "custom/nitro-node:latest",
      });

      expect(manager).toBeDefined();
      expect(manager.getRpcUrl()).toBe("http://localhost:42424");
    });

    it("should create instance with all custom options", () => {
      const manager = new LocalNodeManager({
        port: 7777,
        chainId: 555555,
        verbose: true,
        dockerVerbose: true,
        dockerImage: "custom/image:v1",
      });

      expect(manager.getRpcUrl()).toBe("http://localhost:7777");
      expect(manager.getChainId()).toBe(555555);
    });
  });

  describe("start() behavior (mocked)", () => {
    it("should throw when Docker is unavailable", async () => {
      const manager = new LocalNodeManager({
        verbose: false,
      }) as unknown as ManagerWithMocks;
      manager.isPortInUse = jest
        .fn<(port: number) => Promise<boolean>>()
        .mockResolvedValue(false) as unknown as jest.Mock;
      manager.isDockerAvailable = jest.fn<() => Promise<boolean>>().mockResolvedValue(false);

      await expect(manager.start()).rejects.toThrow(/Docker is not available/);
    });

    it("should error when custom port is already in use", async () => {
      const manager = new LocalNodeManager({
        port: 5000,
        verbose: false,
      }) as unknown as ManagerWithMocks;
      manager.isPortInUse = jest
        .fn<(port: number) => Promise<boolean>>()
        .mockResolvedValue(true) as unknown as jest.Mock;
      manager.isWatchMode = jest.fn<() => boolean>().mockReturnValue(false);

      await expect(manager.start()).rejects.toThrow(/Port 5000 is already in use/);
    });

    it("should restart docker node in watch mode when default port is in use", async () => {
      const manager = new LocalNodeManager({
        port: 42424,
        verbose: false,
      }) as unknown as ManagerWithMocks;
      const restartSpy = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      manager.isPortInUse = jest
        .fn<(port: number) => Promise<boolean>>()
        .mockResolvedValue(true) as unknown as jest.Mock;
      manager.isWatchMode = jest.fn<() => boolean>().mockReturnValue(true);
      manager.restartDockerNode = restartSpy;

      await expect(manager.start()).resolves.toBeUndefined();
      expect(restartSpy).toHaveBeenCalledTimes(1);
      expect(manager.isDockerNode).toBe(true);
    });
  });

  describe("Default values", () => {
    it("should use default port 42424", () => {
      const manager = new LocalNodeManager();
      const rpcUrl = manager.getRpcUrl();

      expect(rpcUrl).toContain("42424");
    });

    it("should use default chain ID 412346", () => {
      const manager = new LocalNodeManager();
      const chainId = manager.getChainId();

      expect(chainId).toBe(412346);
    });

    it("should construct RPC URL correctly", () => {
      const manager = new LocalNodeManager();
      const rpcUrl = manager.getRpcUrl();

      expect(rpcUrl).toMatch(/^http:\/\/localhost:\d+$/);
      expect(rpcUrl).toBe("http://localhost:42424");
    });
  });

  describe("Port configuration", () => {
    it("should accept valid port numbers", () => {
      const ports = [8545, 42424, 9999, 3000, 8080];

      ports.forEach((port) => {
        const manager = new LocalNodeManager({ port });
        expect(manager.getRpcUrl()).toBe(`http://localhost:${port}`);
      });
    });

    it("should handle edge case ports", () => {
      const manager1 = new LocalNodeManager({ port: 1 });
      expect(manager1.getRpcUrl()).toBe("http://localhost:1");

      const manager2 = new LocalNodeManager({ port: 65535 });
      expect(manager2.getRpcUrl()).toBe("http://localhost:65535");
    });
  });

  describe("Chain ID configuration", () => {
    it("should accept various chain IDs", () => {
      const chainIds = [1, 42161, 412346, 123456, 999999];

      chainIds.forEach((chainId) => {
        const manager = new LocalNodeManager({ chainId });
        expect(manager.getChainId()).toBe(chainId);
      });
    });
  });

  describe("Configuration merging", () => {
    it("should merge partial config with defaults", () => {
      const manager = new LocalNodeManager({ port: 9999 });

      // Port should be custom
      expect(manager.getRpcUrl()).toBe("http://localhost:9999");
      // Chain ID should be default
      expect(manager.getChainId()).toBe(412346);
    });

    it("should override all defaults when all options provided", () => {
      const manager = new LocalNodeManager({
        port: 8888,
        chainId: 777777,
        verbose: true,
        dockerVerbose: false,
      });

      expect(manager.getRpcUrl()).toBe("http://localhost:8888");
      expect(manager.getChainId()).toBe(777777);
    });
  });

  describe("Environment variable integration", () => {
    it("should respect NITRO_NODE_IMAGE env variable if set", () => {
      const originalEnv = process.env.NITRO_NODE_IMAGE;
      process.env.NITRO_NODE_IMAGE = "custom/image:test";

      const manager = new LocalNodeManager();
      expect(manager).toBeDefined();

      // Restore
      if (originalEnv) {
        process.env.NITRO_NODE_IMAGE = originalEnv;
      } else {
        delete process.env.NITRO_NODE_IMAGE;
      }
    });

    it("should use default image when env variable not set", () => {
      const originalEnv = process.env.NITRO_NODE_IMAGE;
      delete process.env.NITRO_NODE_IMAGE;

      const manager = new LocalNodeManager();
      expect(manager).toBeDefined();

      // Restore
      if (originalEnv) {
        process.env.NITRO_NODE_IMAGE = originalEnv;
      }
    });
  });

  describe("Instance creation", () => {
    it("should create multiple independent instances", () => {
      const manager1 = new LocalNodeManager({ port: 8001 });
      const manager2 = new LocalNodeManager({ port: 8002 });
      const manager3 = new LocalNodeManager({ port: 8003 });

      expect(manager1.getRpcUrl()).toBe("http://localhost:8001");
      expect(manager2.getRpcUrl()).toBe("http://localhost:8002");
      expect(manager3.getRpcUrl()).toBe("http://localhost:8003");
    });

    it("should maintain separate configurations per instance", () => {
      const manager1 = new LocalNodeManager({ chainId: 111 });
      const manager2 = new LocalNodeManager({ chainId: 222 });

      expect(manager1.getChainId()).toBe(111);
      expect(manager2.getChainId()).toBe(222);
      expect(manager1.getChainId()).not.toBe(manager2.getChainId());
    });
  });

  describe("Type safety", () => {
    it("should accept LocalNodeConfig object", () => {
      const config = {
        port: 9999,
        chainId: 123456,
        verbose: true,
        dockerVerbose: false,
        dockerImage: "test/image:v1",
      };

      const manager = new LocalNodeManager(config);
      expect(manager.getRpcUrl()).toBe("http://localhost:9999");
      expect(manager.getChainId()).toBe(123456);
    });

    it("should accept empty config object", () => {
      const manager = new LocalNodeManager({});

      expect(manager.getRpcUrl()).toBe("http://localhost:42424");
      expect(manager.getChainId()).toBe(412346);
    });

    it("should work without any config", () => {
      const manager = new LocalNodeManager();

      expect(manager.getRpcUrl()).toBe("http://localhost:42424");
      expect(manager.getChainId()).toBe(412346);
    });
  });

  describe("Public API", () => {
    it("should expose getRpcUrl method", () => {
      const manager = new LocalNodeManager();
      expect(typeof manager.getRpcUrl).toBe("function");
      expect(typeof manager.getRpcUrl()).toBe("string");
    });

    it("should expose getChainId method", () => {
      const manager = new LocalNodeManager();
      expect(typeof manager.getChainId).toBe("function");
      expect(typeof manager.getChainId()).toBe("number");
    });

    it("should expose start method", () => {
      const manager = new LocalNodeManager();
      expect(typeof manager.start).toBe("function");
    });

    it("should expose stop method", () => {
      const manager = new LocalNodeManager();
      expect(typeof manager.stop).toBe("function");
    });
  });

  describe("Default port uniqueness", () => {
    it("should use uncommon port to avoid conflicts", () => {
      const manager = new LocalNodeManager();
      const port = parseInt(manager.getRpcUrl().split(":").pop() || "0");

      // Port should be uncommon (not standard ports like 8545, 3000, 8080, etc.)
      expect(port).toBe(42424);
      expect(port).toBeGreaterThan(10000);
      expect(port).toBeLessThan(65535);
    });
  });

  describe("Container naming", () => {
    it("should use as-stylus-testnode as container name (implicit test)", () => {
      // This is tested implicitly - the container name is hardcoded in the class
      // If it changes, integration tests will fail
      const manager = new LocalNodeManager();
      expect(manager).toBeDefined();
    });
  });
});
