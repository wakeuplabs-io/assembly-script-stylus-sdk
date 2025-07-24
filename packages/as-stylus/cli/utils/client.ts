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
import { arbitrumSepolia } from "viem/chains";

type ContractArgs = (string | boolean | Address | bigint)[];

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

export class ContractService {
  private contractAddress: Address;
  private abi: Abi;
  private chain: Chain;
  private publicClient: PublicClient;
  private walletClient: WalletClient;

  constructor(contractAddress: Address, abi: Abi, privateKey: string, rpcUrl: string) {
    this.contractAddress = contractAddress;
    this.abi = abi;
    const chain = getChainForRpc(rpcUrl);
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
