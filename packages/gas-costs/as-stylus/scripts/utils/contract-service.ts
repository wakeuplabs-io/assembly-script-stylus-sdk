import {
  type Address,
  WalletClient,
  Account,
  Abi,
  encodeFunctionData,
  decodeFunctionResult,
} from "viem";

import { publicClient } from "../config/clients";

export function contractService(contractAddr: Address, abi: Abi, verbose: boolean = false) {
  return {
    address: contractAddr,
    write: async (
      walletClient: WalletClient,
      functionName: string,
      args: any[],
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

    read: async (functionName: string, args: any[], gasLimit?: bigint) => {
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
  };
}

export type ContractService = ReturnType<typeof contractService>;
