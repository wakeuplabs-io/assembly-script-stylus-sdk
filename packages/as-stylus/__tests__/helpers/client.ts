import { config } from "dotenv";
import {
  createWalletClient,
  createPublicClient,
  http,
  type Hex,
  type Address,
  WalletClient,
  Account,
  Abi,
  encodeFunctionData,
  decodeFunctionResult,
  decodeErrorResult,
  CallExecutionError,
  BaseError,
  ContractFunctionRevertedError,
  ContractFunctionExecutionError,
  keccak256,
  toBytes,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

import { RPC_URL } from "./constants.js";
import { ContractArgs } from "./setup.js";

config();

function getChainForRpc(url: string) {
  if (url.includes("localhost")) {
    return {
      id: 412346,
      name: "Local Arbitrum Sepolia",
      network: "localhost",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [url] }, public: { http: [url] } },
    } as const;
  }
  return arbitrumSepolia;
}

const chain = getChainForRpc(RPC_URL);

export const publicClient = createPublicClient({
  chain,
  transport: http(RPC_URL),
});

export const getWalletClient = (privateKey: string) =>
  createWalletClient({
    account: privateKeyToAccount(privateKey as Hex),
    chain,
    transport: http(RPC_URL),
  }) as WalletClient;

export function contractService(contractAddr: Address, abi: Abi, verbose: boolean = false) {
  return {
    address: contractAddr,
    write: async (
      walletClient: WalletClient,
      functionName: string,
      args: ContractArgs,
      value?: bigint,
    ) => {
      const data = encodeFunctionData({ abi, functionName, args });
      if (verbose) console.log("→ write calldata:", data);

      const { request } = await publicClient.simulateContract({
        address: contractAddr as Address,
        abi,
        functionName,
        args,
        account: walletClient.account as Account,
        chain,
        value,
      });

      const result = await walletClient.writeContract(request);
      if (verbose) console.log({ request, result, functionName });
      return result;
    },

    read: async (
      functionName: string,
      args: (string | boolean | Address | bigint)[],
      gasLimit?: bigint,
    ) => {
      const data = encodeFunctionData({ abi, functionName, args });
      if (verbose) console.log("→ calldata:", data);

      const { data: raw } = await publicClient.call({
        to: contractAddr,
        data,
        gas: gasLimit,
      } as const);

      if (verbose) console.log("← raw:", raw);
      const decoded = decodeFunctionResult({ abi, functionName, data: raw || "0x" });
      if (verbose) console.log("← decoded:", decoded);

      return decoded;
    },

    readWithAccount: async (
      walletClient: WalletClient,
      functionName: string,
      args: (string | boolean | Address | bigint)[] = [],
      value?: bigint,
      gasLimit?: bigint,
    ) => {
      const data = encodeFunctionData({ abi, functionName, args });
      if (verbose) console.log("→ calldata with account:", data);

      const { data: raw } = await publicClient.call({
        to: contractAddr,
        data,
        account: walletClient.account as Account,
        value,
        gas: gasLimit,
      } as const);

      if (verbose) console.log("← raw with account:", raw);
      const decoded = decodeFunctionResult({ abi, functionName, data: raw || "0x" });
      if (verbose) console.log("← decoded with account:", decoded);

      return decoded;
    },

    readRaw: async (functionName: string, args: ContractArgs = []) => {
      const data = encodeFunctionData({ abi, functionName, args });
      if (verbose) console.log("→ calldata:", data);

      try {
        const { data: returnData } = await publicClient.call({ to: contractAddr, data });
        if (verbose) console.log("← raw success:", returnData);

        const decoded = decodeFunctionResult({ abi, functionName, data: returnData || "0x" });
        if (verbose) console.log("← decoded success:", decoded);

        return { success: true, returnData: decoded };
      } catch (err) {
        if (verbose) console.log("← error caught:", err);

        if (!(err instanceof CallExecutionError)) {
          throw err;
        }

        let revertData: Hex | undefined;

        if (err instanceof BaseError) {
          const revertError = err.walk((e) => e instanceof ContractFunctionRevertedError);
          if (revertError instanceof ContractFunctionRevertedError) {
            const errorData = revertError.data;
            if (errorData && typeof errorData === "object" && "data" in errorData) {
              revertData = (errorData as { data: Hex }).data;
            }
          }
        }

        if (!revertData && err.cause && typeof err.cause === "object") {
          const cause = err.cause as { cause: { data: Hex } };

          if (cause.cause && typeof cause.cause === "object" && "data" in cause.cause) {
            const deepCauseData = cause.cause.data;
            if (typeof deepCauseData === "string" && deepCauseData.startsWith("0x")) {
              revertData = deepCauseData as Hex;
            }
          }

          if (!revertData && "data" in cause) {
            const causeData = cause.data;
            if (typeof causeData === "string" && causeData.startsWith("0x")) {
              revertData = causeData as Hex;
            }
          }
        }
        if (!revertData && err.details) {
          const detailsMatch = err.details.match(/0x[a-fA-F0-9]+/);
          if (detailsMatch?.[0]) {
            revertData = detailsMatch[0] as `0x${string}`;
          }
        }

        if (!revertData || revertData === "0x") {
          if (verbose) console.log("← no revert data found");
          return { success: false, error: { name: "Unknown", args: [] } };
        }

        if (verbose) console.log("← revert data:", revertData);

        try {
          const { errorName, args: errorArgs } = decodeErrorResult({
            abi,
            data: revertData,
          });

          if (verbose) console.log("← decoded error:", { errorName, args: errorArgs });

          return {
            success: false,
            error: {
              name: errorName,
              args: Array.isArray(errorArgs) ? [...errorArgs] : [],
            },
          };
        } catch (decodeErr) {
          if (verbose) console.log("← failed to decode error:", decodeErr);
          return { success: false, error: { name: "DecodeError", args: [] } };
        }
      }
    },

    writeRaw: async (walletClient: WalletClient, functionName: string, args: ContractArgs = []) => {
      const data = encodeFunctionData({ abi, functionName, args });
      if (verbose) console.log("→ write calldata:", data);

      try {
        const { request } = await publicClient.simulateContract({
          address: contractAddr as Address,
          abi,
          functionName,
          args,
          account: walletClient.account as Account,
          chain,
        });

        const txHash = await walletClient.writeContract(request);
        if (verbose) console.log("← txHash:", txHash);

        return { success: true, txHash };
        //TODO: revise catch because typing is not correct
      } catch (err: any) {
        if (verbose) console.log("← write error caught:", err);

        if (!(err instanceof ContractFunctionExecutionError)) throw err;

        const errAny = err as any;
        // this if statement cannot be accessed
        if (errAny.data && typeof errAny.data === "object" && "errorName" in errAny.data) {
          const errorData = errAny.data;
          if (verbose) console.log("← error data from ContractFunctionExecutionError:", errorData);

          return {
            success: false,
            error: {
              name: errorData.errorName,
              args: Array.isArray(errorData.args) ? [...errorData.args] : [],
            },
          };
        }

        let revertData: Hex | undefined;

        if (errAny.raw && typeof errAny.raw === "string" && errAny.raw.startsWith("0x")) {
          revertData = errAny.raw as Hex;
        }

        if (!revertData && err.cause && typeof err.cause === "object") {
          const cause = err.cause as any;

          if (cause.data && typeof cause.data === "string" && cause.data.startsWith("0x")) {
            revertData = cause.data as Hex;
          }

          if (
            !revertData &&
            cause.raw &&
            typeof cause.raw === "string" &&
            cause.raw.startsWith("0x")
          ) {
            revertData = cause.raw as Hex;
          }
        }

        if (!revertData && errAny.metaMessages) {
          for (const message of errAny.metaMessages) {
            const match = message.match(/0x[a-fA-F0-9]+/);
            if (match) {
              revertData = match[0] as Hex;
              break;
            }
          }
        }

        if (!revertData || revertData === "0x") {
          if (verbose) console.log("← no revert data found (write)");
          return { success: false, error: { name: "Unknown", args: [] } };
        }

        if (verbose) console.log("← revert data (write):", revertData);

        try {
          const { errorName, args: errorArgs } = decodeErrorResult({ abi, data: revertData });
          if (verbose) console.log("← decoded error (write):", { errorName, args: errorArgs });

          return {
            success: false,
            error: {
              name: errorName,
              args: Array.isArray(errorArgs) ? [...errorArgs] : [],
            },
          };
        } catch (decodeErr) {
          if (verbose) console.log("← failed to decode error (write):", decodeErr);
          return { success: false, error: { name: "DecodeError", args: [] } };
        }
      }
    },

    /**
     * Executes a raw transaction with custom calldata, bypassing ABI validation
     * @param walletClient - Wallet client for signing transactions
     * @param calldata - Raw hex calldata to send
     * @param value - ETH value to send (optional)
     * @param gasLimit - Gas limit for transaction (optional, defaults to 30M)
     * @returns Transaction result with success status
     */
    writeRawTransaction: async (
      walletClient: WalletClient,
      calldata: Hex,
      value?: bigint,
      gasLimit?: bigint
    ) => {
      if (verbose) console.log("→ raw transaction calldata:", calldata);

      try {
        const txRequest = {
          to: contractAddr,
          data: calldata,
          value: value || 0n,
          gas: gasLimit || 30000000n, // Default 30M gas for raw transactions
          account: walletClient.account as Account,
          chain,
        };

        const txHash = await walletClient.sendTransaction(txRequest);
        if (verbose) console.log("← raw txHash:", txHash);

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        if (verbose) console.log("← raw transaction receipt status:", receipt.status);
        
        const success = receipt.status === 'success';
        
        return { success, txHash, receipt };
      } catch (error: any) {
        if (verbose) console.log("← raw transaction error:", error);

        return {
          success: false,
          error: {
            name: error.name || "RawTransactionError",
            args: error.message ? [error.message] : [],
          },
        };
      }
    },

    /**
     * Generates invalid calldata to trigger fallback function
     * @param fakeFunctionName - Name for fake function (default: "invalidFunction")
     * @returns 4-byte function selector that doesn't exist in ABI
     */
    buildInvalidCalldata: (fakeFunctionName: string = "invalidFunction"): Hex => {
      const functionSignature = `${fakeFunctionName}()`;
      const hash = keccak256(toBytes(functionSignature));
      const selector = hash.slice(0, 10) as Hex;
      if (verbose) console.log("→ generated invalid selector:", selector, "for signature:", functionSignature);
      return selector;
    },

    /**
     * Generates empty calldata to trigger receive function
     * @returns Empty hex string "0x"
     */
    buildEmptyCalldata: (): Hex => {
      return "0x";
    },
  };
}

export type ContractService = ReturnType<typeof contractService>;
