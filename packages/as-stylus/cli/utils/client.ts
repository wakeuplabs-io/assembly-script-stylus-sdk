import {
  createWalletClient,
  createPublicClient,
  http,
  type Hex,
  type Address,
  WalletClient,
  Account,
  Abi,
  PublicClient,
  Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

type ContractArgs = (string | boolean | Address | bigint)[];

async function getChainIdFromRpc(url: string): Promise<number> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_chainId",
        params: [],
        id: 1,
      }),
    });

    const data = await response.json();
    return parseInt(data.result, 16);
  } catch (error) {
    console.warn(`Failed to get chain ID from ${url}, falling back to Arbitrum Sepolia`);
    return 421614;
  }
}

async function getChainForRpc(url: string) {
  if (url.includes("localhost")) {
    return {
      id: 412346,
      name: "Local Arbitrum Sepolia",
      network: "localhost",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [url] }, public: { http: [url] } },
    } as const;
  }

  const chainId = await getChainIdFromRpc(url);

  return {
    id: chainId,
    name: `Custom Network (${chainId})`,
    network: `custom-${chainId}`,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: [url] },
      public: { http: [url] },
    },
  } as const;
}

export class ContractService {
  private contractAddress: Address;
  private abi: Abi;
  private chain: Chain;
  private publicClient: PublicClient;
  private walletClient: WalletClient;

  private constructor(
    contractAddress: Address,
    abi: Abi,
    privateKey: string,
    chain: Chain,
    rpcUrl: string,
  ) {
    this.contractAddress = contractAddress;
    this.abi = abi;
    this.chain = chain;
    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    this.walletClient = createWalletClient({
      account: privateKeyToAccount(privateKey as Hex),
      chain,
      transport: http(rpcUrl),
    }) as WalletClient;
  }

  static async create(
    contractAddress: Address,
    abi: Abi,
    privateKey: string,
    rpcUrl: string,
  ): Promise<ContractService> {
    const chain = await getChainForRpc(rpcUrl);
    return new ContractService(contractAddress, abi, privateKey, chain, rpcUrl);
  }

  async write(functionName: string, args: ContractArgs) {
    const { request } = await this.publicClient.simulateContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName,
      args,
      account: this.walletClient.account as Account,
      chain: this.chain,
    });

    const result = await this.walletClient.writeContract(request);
    return result;
  }
}
