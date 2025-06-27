// ---------------------------------------------------------------
//  Utils — build / deploy / call helpers for Stylus e2e tests
// ---------------------------------------------------------------
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
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

import { RPC_URL } from "./utils.js";

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

export function contractService(contractAddr: Address, abi: Abi) {
  return {
    write: async (walletClient: WalletClient, functionName: string, args: any[]) => {
      const { request } = await publicClient.simulateContract({
        address: contractAddr as Address,
        abi,
        functionName,
        args,
        account: walletClient.account as Account,
        chain,
      });

      const result = await walletClient.writeContract(request);
      return result;
    },

    read: async (functionName: string, args: any[]) => {
      const result = await publicClient.readContract({
        address: contractAddr as Address,
        abi,
        functionName,
        args,
      });

      return result;
    },
  };
}
