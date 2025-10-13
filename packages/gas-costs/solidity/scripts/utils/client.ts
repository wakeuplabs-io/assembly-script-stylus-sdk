import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

export const getWalletClient = () =>
  createWalletClient({
    account,
    transport: http(process.env.RPC_URL),
  });
