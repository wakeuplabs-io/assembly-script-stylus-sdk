// ---------------------------------------------------------------
//  End-to-end tests — Custom Errors contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import { Hex, WalletClient } from "viem";

config();

import { contractService, getWalletClient } from "../helpers/client.js";
import { CONTRACT_PATHS, DEPLOY_TIMEOUT, PRIVATE_KEY } from "../helpers/constants.js";
import { setupE2EContract } from "../helpers/setup.js";
import { expectRevert, handleDeploymentError } from "../helpers/utils.js";

const walletClient: WalletClient = getWalletClient(PRIVATE_KEY as Hex);

const { contract: contractPath, abi: abiPath } = CONTRACT_PATHS.CUSTOM_ERRORS;

let contract: ReturnType<typeof contractService>;

beforeAll(async () => {
  try {
    contract = await setupE2EContract(contractPath, abiPath, {
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
    const dec = await expectRevert(contract, "errInvalidOwner");
    expect(dec.errorName).toBe("ERC721InvalidOwner");
  });

  it("ERC721NonexistentToken", async () => {
    const dec = await expectRevert(contract, "errNonexistentToken");
    expect(dec.errorName).toBe("ERC721NonexistentToken");
  });

  it("ERC721InvalidSender", async () => {
    const dec = await expectRevert(contract, "errInvalidSender");
    expect(dec.errorName).toBe("ERC721InvalidSender");
  });

  it("ERC721InvalidReceiver", async () => {
    const dec = await expectRevert(contract, "errInvalidReceiver");
    expect(dec.errorName).toBe("ERC721InvalidReceiver");
  });

  it("ERC721InvalidApprover", async () => {
    const dec = await expectRevert(contract, "errInvalidApprover");
    expect(dec.errorName).toBe("ERC721InvalidApprover");
  });

  it("ERC721InvalidOperator", async () => {
    const dec = await expectRevert(contract, "errInvalidOperator");
    expect(dec.errorName).toBe("ERC721InvalidOperator");
  });

  it("ERC721IncorrectOwner (multi param)", async () => {
    const dec = await expectRevert(contract, "errIncorrectOwner");
    expect(dec.errorName).toBe("ERC721IncorrectOwner");
    expect(dec.args.length).toBe(3);
  });

  it("ERC721InsufficientApproval (multi param)", async () => {
    const dec = await expectRevert(contract, "errInsufficientApproval");
    expect(dec.errorName).toBe("ERC721InsufficientApproval");
    expect(dec.args.length).toBe(2);
  });
});
