import { createWalletClient, createPublicClient, http, WalletClient, PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia, arbitrum } from "viem/chains";

function getChainForRpc(chainId: number, rpcUrl: string) {
  switch (chainId) {
    case 412346:
      return {
        id: 412346,
        name: "Local Arbitrum Sepolia",
        network: "localhost",
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } },
      } as const;
    case arbitrumSepolia.id:
      return arbitrumSepolia;
    case arbitrum.id:
      return arbitrum;
    default:
      throw new Error(`Chain ID ${chainId} not supported`);
  }
}

export const getPublicClient = (chainId: number, rpcUrl: string) => {
  const chain = getChainForRpc(chainId, rpcUrl);
  return createPublicClient({ chain, transport: http(rpcUrl) }) as PublicClient;
};

export const getWalletClient = (chainId: number, privateKey: string, rpcUrl: string) => {
  const chain = getChainForRpc(chainId, rpcUrl);
  return createWalletClient({
    account: privateKeyToAccount(privateKey as `0x${string}`),
    chain,
    transport: http(rpcUrl),
  }) as WalletClient;
};
