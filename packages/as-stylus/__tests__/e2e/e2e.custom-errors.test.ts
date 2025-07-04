// ---------------------------------------------------------------
//  End-to-end tests — Custom Errors contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

config();

import { contractService, getWalletClient } from "./client.js";
import {
  CONTRACT_PATHS,
  CONTRACT_ADDRESS_REGEX,
  DEPLOY_TIMEOUT,
  PRIVATE_KEY,
} from "./constants.js";
import { setupE2EContract } from "./setup.js";
import { handleDeploymentError } from "../helpers/utils.js";

const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);

const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.CUSTOM_ERRORS;

let contract: ReturnType<typeof contractService>;

type DecodedError = {
  errorName: string;
  args: unknown[];
};

async function expectRevert(functionName: string): Promise<DecodedError> {
  const result = await contract.readRaw(functionName, []);

  if (result.success) {
    throw new Error("Expected revert but call succeeded");
  }

  if (!result.error) {
    throw new Error("Expected error but none found");
  }

  return {
    errorName: result.error.name,
    args: result.error.args,
  };
}

beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, CONTRACT_ADDRESS_REGEX, {
      walletClient,
    });
  } catch (e) {
    handleDeploymentError(e);
  }
}, DEPLOY_TIMEOUT);

describe("Custom Errors Contract Tests", () => {
  it("should deploy", () => {
    expect(contract).toBeTruthy();
  });

  it("ERC721InvalidOwner", async () => {
    const dec = await expectRevert("errInvalidOwner");
    expect(dec.errorName).toBe("ERC721InvalidOwner");
  });

  it("ERC721NonexistentToken", async () => {
    const dec = await expectRevert("errNonexistentToken");
    expect(dec.errorName).toBe("ERC721NonexistentToken");
  });

  it("ERC721InvalidSender", async () => {
    const dec = await expectRevert("errInvalidSender");
    expect(dec.errorName).toBe("ERC721InvalidSender");
  });

  it("ERC721InvalidReceiver", async () => {
    const dec = await expectRevert("errInvalidReceiver");
    expect(dec.errorName).toBe("ERC721InvalidReceiver");
  });

  it("ERC721InvalidApprover", async () => {
    const dec = await expectRevert("errInvalidApprover");
    expect(dec.errorName).toBe("ERC721InvalidApprover");
  });

  it("ERC721InvalidOperator", async () => {
    const dec = await expectRevert("errInvalidOperator");
    expect(dec.errorName).toBe("ERC721InvalidOperator");
  });

  it("ERC721IncorrectOwner (multi param)", async () => {
    const dec = await expectRevert("errIncorrectOwner");
    expect(dec.errorName).toBe("ERC721IncorrectOwner");
    expect(dec.args.length).toBe(3);
  });

  it("ERC721InsufficientApproval (multi param)", async () => {
    const dec = await expectRevert("errInsufficientApproval");
    expect(dec.errorName).toBe("ERC721InsufficientApproval");
    expect(dec.args.length).toBe(2);
  });
});
