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
    write: async (walletClient: WalletClient, functionName: string, args: ContractArgs) => {
      const data = encodeFunctionData({ abi, functionName, args });
      if (verbose) console.log("→ write calldata:", data);

      const { request } = await publicClient.simulateContract({
        address: contractAddr as Address,
        abi,
        functionName,
        args,
        account: walletClient.account as Account,
        chain,
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
  };
}

export type ContractService = ReturnType<typeof contractService>;
