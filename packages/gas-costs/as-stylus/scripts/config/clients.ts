import { config } from "dotenv";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

import env from "./env";

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

const chain = getChainForRpc(env.RPC_URL);

export const publicClient = createPublicClient({
  chain,
  transport: http(env.RPC_URL),
});

export const getWalletClient = () => {
  return createWalletClient({
    account: privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`),
    chain,
    transport: http(env.RPC_URL),
  });
};
