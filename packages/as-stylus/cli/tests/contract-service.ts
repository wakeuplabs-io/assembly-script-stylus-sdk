import {
  type Address,
  Account,
  Abi,
  CallExecutionError,
  ContractFunctionExecutionError,
  PublicClient,
  WalletClient,
  decodeFunctionResult,
  encodeFunctionData,
} from "viem";

import { decodeContractError } from "./error-utils.js";
import { ContractArgs, ContractService, ReadRawResult, WriteRawResult } from "./types.js";

export function contractService(
  publicClient: PublicClient,
  contractAddr: Address,
  abi: Abi,
  verbose: boolean = false,
): ContractService {
  return {
    address: contractAddr,
    write: async (
      walletClient: WalletClient,
      functionName: string,
      args: ContractArgs,
      value?: bigint,
      nonce?: number,
    ) => {
      const data = encodeFunctionData({ abi, functionName, args });
      if (verbose) console.log("→ write calldata:", data);

      const { request } = await publicClient.simulateContract({
        address: contractAddr as Address,
        abi,
        functionName,
        args: args as readonly unknown[],
        account: walletClient.account as Account,
        chain: walletClient.chain,
        value,
        nonce,
      });

      const result = await walletClient.writeContract({
        ...request,
        nonce,
      });
      return result;
    },

    read: async (functionName: string, args: ContractArgs, gasLimit?: bigint) => {
      const data = encodeFunctionData({ abi, functionName, args });
      if (verbose) console.log("→ read calldata:", data);

      const { data: raw } = await publicClient.call({
        to: contractAddr,
        data,
        gas: gasLimit,
      } as const);
      if (verbose) console.log("← read raw:", raw);
      const decoded = decodeFunctionResult({ abi, functionName, data: raw || "0x" });
      if (verbose) console.log("← read decoded:", decoded);
      return decoded;
    },

    readRaw: async (functionName: string, args: ContractArgs = []): Promise<ReadRawResult> => {
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

        const error = decodeContractError(abi, err);
        if (verbose) console.log("← decoded error result:", error);

        return { success: false, error };
      }
    },

    writeRaw: async (
      walletClient: WalletClient,
      functionName: string,
      args: ContractArgs = [],
    ): Promise<WriteRawResult> => {
      const data = encodeFunctionData({ abi, functionName, args });
      if (verbose) console.log("→ write calldata:", data);

      try {
        const { request } = await publicClient.simulateContract({
          address: contractAddr as Address,
          abi,
          functionName,
          args,
          account: walletClient.account as Account,
          chain: walletClient.chain,
        });

        const txHash = await walletClient.writeContract(request);
        if (verbose) console.log("← txHash:", txHash);

        return { success: true, txHash };
        //TODO: revise catch because typing is not correct
      } catch (err: unknown) {
        if (verbose) console.log("← write error caught:", err);

        if (!(err instanceof ContractFunctionExecutionError)) throw err;

        const error = decodeContractError(abi, err);
        if (verbose) console.log("← decoded error (write):", error);

        return { success: false, error };
      }
    },
  };
}
