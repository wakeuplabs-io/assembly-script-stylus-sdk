// ---------------------------------------------------------------
//  End-to-end tests — Custom Errors contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import path from "path";

config();

import {
  ROOT,
  RPC_URL,
  PRIVATE_KEY,
  run,
  stripAnsi,
  calldata,
  createContractHelpers,
  getFunctionSelector,
} from "../helpers/utils.js";

const SELECTOR = {
  DEPLOY: getFunctionSelector("deploy()"),
  ERR_INVALID_OWNER: getFunctionSelector("errInvalidOwner()"),
  ERR_NONEXISTENT_TOKEN: getFunctionSelector("errNonexistentToken()"),
  ERR_INCORRECT_OWNER: getFunctionSelector("errIncorrectOwner()"),
  ERR_INVALID_SENDER: getFunctionSelector("errInvalidSender()"),
  ERR_INVALID_RECEIVER: getFunctionSelector("errInvalidReceiver()"),
  ERR_INSUFFICIENT_APPROVAL: getFunctionSelector("errInsufficientApproval()"),
  ERR_INVALID_APPROVER: getFunctionSelector("errInvalidApprover()"),
  ERR_INVALID_OPERATOR: getFunctionSelector("errInvalidOperator()"),
};

// Custom error selectors (calculated from error signatures)
const ERROR_SELECTORS = {
  ERC721InvalidOwner: getFunctionSelector("ERC721InvalidOwner()"),
  ERC721NonexistentToken: getFunctionSelector("ERC721NonexistentToken()"),
  ERC721IncorrectOwner: getFunctionSelector("ERC721IncorrectOwner()"),
  ERC721InvalidSender: getFunctionSelector("ERC721InvalidSender()"),
  ERC721InvalidReceiver: getFunctionSelector("ERC721InvalidReceiver()"),
  ERC721InsufficientApproval: getFunctionSelector("ERC721InsufficientApproval()"),
  ERC721InvalidApprover: getFunctionSelector("ERC721InvalidApprover()"),
  ERC721InvalidOperator: getFunctionSelector("ERC721InvalidOperator()"),
};

let contractAddr = "";
let helpers: ReturnType<typeof createContractHelpers>;

beforeAll(() => {
  try {
    const projectRoot = path.join(ROOT, "/as-stylus/");
    const pkg = path.join(ROOT, "/as-stylus/__tests__/contracts/custom-errors");
    run("npm run pre:build", projectRoot);
    run("npx as-stylus build", pkg);
    run("npm run compile", pkg);
    run("npm run check", pkg);

    const dataDeploy = calldata(SELECTOR.DEPLOY);
    const deployLog = stripAnsi(run(`PRIVATE_KEY=${PRIVATE_KEY} npm run deploy`, pkg));
    const m = deployLog.match(/deployed code at address:\s*(0x[0-9a-fA-F]{40})/i);
    if (!m) throw new Error("Could not scrape contract address");
    contractAddr = m[1];
    helpers = createContractHelpers(contractAddr);
    run(
      `cast send ${contractAddr} ${dataDeploy} --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL}`,
    );

    console.log("📍 Deployed Custom Errors contract at", contractAddr);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to deploy custom errors contract:", errorMessage);
    throw error;
  }
}, 120_000);

const castSend = (sel: string, gasLimit?: string) => helpers.sendData(sel, gasLimit);

// Helper function to extract custom error from transaction output
function extractCustomError(output: string): { selector: string; data: string } | null {
  // Look for execution reverted with data pattern
  const revertMatch = output.match(/execution reverted\s*(?:with reason:|:)?\s*0x([0-9a-fA-F]+)/i);
  if (revertMatch) {
    const hexData = revertMatch[1];
    if (hexData.length >= 8) {
      return {
        selector: "0x" + hexData.slice(0, 8),
        data: "0x" + hexData,
      };
    }
  }
  return null;
}

// Helper function to expect a specific custom error
function expectCustomError(selector: string, expectedErrorName: string, expectedSelector: string) {
  try {
    castSend(selector);
    fail(`Expected ${expectedErrorName} to be thrown, but call succeeded`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const customError = extractCustomError(errorMessage);

    expect(customError).toBeTruthy();
    expect(customError!.selector.toLowerCase()).toBe(expectedSelector.toLowerCase());
  }
}

describe.skip("Custom Errors Contract Tests", () => {
  describe("Contract Deployment", () => {
    it("should deploy successfully", () => {
      expect(contractAddr).toBeTruthy();
      expect(contractAddr.startsWith("0x")).toBe(true);
    });
  });

  describe("Simple Custom Errors (Single Parameter)", () => {
    it("should throw ERC721InvalidOwner error", () => {
      expectCustomError(
        SELECTOR.ERR_INVALID_OWNER,
        "ERC721InvalidOwner",
        ERROR_SELECTORS.ERC721InvalidOwner,
      );
    });

    it("should throw ERC721NonexistentToken error", () => {
      expectCustomError(
        SELECTOR.ERR_NONEXISTENT_TOKEN,
        "ERC721NonexistentToken",
        ERROR_SELECTORS.ERC721NonexistentToken,
      );
    });

    it("should throw ERC721InvalidSender error", () => {
      expectCustomError(
        SELECTOR.ERR_INVALID_SENDER,
        "ERC721InvalidSender",
        ERROR_SELECTORS.ERC721InvalidSender,
      );
    });

    it("should throw ERC721InvalidReceiver error", () => {
      expectCustomError(
        SELECTOR.ERR_INVALID_RECEIVER,
        "ERC721InvalidReceiver",
        ERROR_SELECTORS.ERC721InvalidReceiver,
      );
    });

    it("should throw ERC721InvalidApprover error", () => {
      expectCustomError(
        SELECTOR.ERR_INVALID_APPROVER,
        "ERC721InvalidApprover",
        ERROR_SELECTORS.ERC721InvalidApprover,
      );
    });

    it("should throw ERC721InvalidOperator error", () => {
      expectCustomError(
        SELECTOR.ERR_INVALID_OPERATOR,
        "ERC721InvalidOperator",
        ERROR_SELECTORS.ERC721InvalidOperator,
      );
    });
  });

  describe("Multi-Parameter Custom Errors", () => {
    it("should throw ERC721IncorrectOwner error with three parameters", () => {
      expectCustomError(
        SELECTOR.ERR_INCORRECT_OWNER,
        "ERC721IncorrectOwner",
        ERROR_SELECTORS.ERC721IncorrectOwner,
      );
    });

    it("should throw ERC721InsufficientApproval error with two parameters", () => {
      expectCustomError(
        SELECTOR.ERR_INSUFFICIENT_APPROVAL,
        "ERC721InsufficientApproval",
        ERROR_SELECTORS.ERC721InsufficientApproval,
      );
    });
  });

  describe("Error Data Validation", () => {
    it("should include proper error data for single parameter errors", () => {
      try {
        castSend(SELECTOR.ERR_INVALID_OWNER);
        fail("Expected error to be thrown");
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const customError = extractCustomError(errorMessage);

        expect(customError).toBeTruthy();
        expect(customError!.selector).toBe(ERROR_SELECTORS.ERC721InvalidOwner);

        // Should have 4 bytes selector + 32 bytes for one Address parameter = 36 bytes = 72 hex chars
        expect(customError!.data.length).toBe(2 + 72); // "0x" + 72 hex chars
      }
    });

    it("should include proper error data for multi-parameter errors", () => {
      try {
        castSend(SELECTOR.ERR_INCORRECT_OWNER);
        fail("Expected error to be thrown");
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const customError = extractCustomError(errorMessage);

        expect(customError).toBeTruthy();
        expect(customError!.selector).toBe(ERROR_SELECTORS.ERC721IncorrectOwner);

        // Should have 4 bytes selector + 3 * 32 bytes (Address + U256 + Address) = 100 bytes = 200 hex chars
        expect(customError!.data.length).toBe(2 + 200); // "0x" + 200 hex chars
      }
    });

    it("should validate error selector consistency", () => {
      const errorTests = [
        {
          method: SELECTOR.ERR_INVALID_OWNER,
          expected: ERROR_SELECTORS.ERC721InvalidOwner,
        },
        {
          method: SELECTOR.ERR_NONEXISTENT_TOKEN,
          expected: ERROR_SELECTORS.ERC721NonexistentToken,
        },
        {
          method: SELECTOR.ERR_INVALID_SENDER,
          expected: ERROR_SELECTORS.ERC721InvalidSender,
        },
        {
          method: SELECTOR.ERR_INVALID_RECEIVER,
          expected: ERROR_SELECTORS.ERC721InvalidReceiver,
        },
        {
          method: SELECTOR.ERR_INVALID_APPROVER,
          expected: ERROR_SELECTORS.ERC721InvalidApprover,
        },
        {
          method: SELECTOR.ERR_INVALID_OPERATOR,
          expected: ERROR_SELECTORS.ERC721InvalidOperator,
        },
      ];

      errorTests.forEach(({ method, expected }) => {
        try {
          castSend(method);
          fail("Expected error to be thrown");
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const customError = extractCustomError(errorMessage);
          expect(customError!.selector.toLowerCase()).toBe(expected.toLowerCase());
        }
      });
    });
  });

  describe("Error Types Coverage", () => {
    it("should cover all defined custom errors", () => {
      const allErrors = Object.keys(ERROR_SELECTORS);
      const allMethods = [
        SELECTOR.ERR_INVALID_OWNER,
        SELECTOR.ERR_NONEXISTENT_TOKEN,
        SELECTOR.ERR_INCORRECT_OWNER,
        SELECTOR.ERR_INVALID_SENDER,
        SELECTOR.ERR_INVALID_RECEIVER,
        SELECTOR.ERR_INSUFFICIENT_APPROVAL,
        SELECTOR.ERR_INVALID_APPROVER,
        SELECTOR.ERR_INVALID_OPERATOR,
      ];

      expect(allErrors.length).toBe(8);
      expect(allMethods.length).toBe(8);

      // Ensure all errors are unique
      const uniqueSelectors = new Set(Object.values(ERROR_SELECTORS));
      expect(uniqueSelectors.size).toBe(allErrors.length);
    });

    it("should handle consecutive error calls correctly", () => {
      // Test that multiple error calls work independently
      const methods = [
        SELECTOR.ERR_INVALID_OWNER,
        SELECTOR.ERR_INVALID_SENDER,
        SELECTOR.ERR_INVALID_RECEIVER,
      ];

      methods.forEach((method) => {
        try {
          castSend(method);
          fail("Expected error to be thrown");
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const customError = extractCustomError(errorMessage);
          expect(customError).toBeTruthy();
          expect(customError!.selector).toMatch(/^0x[0-9a-fA-F]{8}$/);
        }
      });
    });
  });

  describe("Gas Usage and Performance", () => {
    it("should have reasonable gas consumption for custom errors", () => {
      // Custom errors should be more gas-efficient than string revert messages
      try {
        castSend(SELECTOR.ERR_INVALID_OWNER, "100000"); // Set reasonable gas limit
        fail("Expected error to be thrown");
      } catch (error: unknown) {
        // Error is expected, just verify it doesn't run out of gas
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).not.toContain("out of gas");
        expect(errorMessage).not.toContain("gas required exceeds allowance");
      }
    });

    it("should handle complex multi-parameter errors efficiently", () => {
      try {
        castSend(SELECTOR.ERR_INCORRECT_OWNER, "150000"); // Slightly higher for multi-param
        fail("Expected error to be thrown");
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).not.toContain("out of gas");

        const customError = extractCustomError(errorMessage);
        expect(customError).toBeTruthy();
        expect(customError!.selector).toBe(ERROR_SELECTORS.ERC721IncorrectOwner);
      }
    });
  });
});
