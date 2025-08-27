/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createPublicClient,
  http,
  type Hex,
  type Address,
  type WalletClient,
  type Abi,
  encodeFunctionData,
  decodeFunctionResult,
  decodeErrorResult,
  CallExecutionError,
  BaseError,
  ContractFunctionRevertedError,
  ContractFunctionExecutionError,
} from "viem"

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
    return 421614; // Fallback to Arbitrum Sepolia
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

  const chainConfig = {
    id: chainId,
    name: `Custom Network (${chainId})`,
    network: `custom-${chainId}`,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: [url] },
      public: { http: [url] },
    },
  } as const;

  return chainConfig;
}

const createPublicClientWithRpc = async (rpcEndpoint: string) => {
  const chain = await getChainForRpc(rpcEndpoint);
  return createPublicClient({
    chain,
    transport: http(rpcEndpoint),
  });
}

export type ContractArgs = (string | boolean | Address | bigint | number)[]

export interface ContractCallResult {
  success: boolean
  data?: any
  error?: {
    name: string
    args: any[]
  }
}

export interface ContractWriteResult {
  success: boolean
  txHash?: Hex
  error?: {
    name: string
    args: any[]
  }
}

export async function createContractService(contractAddress: Address, abi: Abi, rpcEndpoint: string = "https://sepolia-rollup.arbitrum.io/rpc", verbose: boolean = false) {
  const publicClient = await createPublicClientWithRpc(rpcEndpoint)
  
  const read = async (functionName: string, args: ContractArgs = []): Promise<ContractCallResult> => {
    try {
      const data = encodeFunctionData({ abi, functionName, args })
      if (verbose) console.log("→ read calldata:", data)

      const { data: returnData } = await publicClient.call({ 
        to: contractAddress, 
        data 
      })
      if (verbose) console.log("← raw response:", returnData)

      const decoded = decodeFunctionResult({ 
        abi, 
        functionName, 
        data: returnData || "0x" 
      })
      if (verbose) console.log("← decoded result:", decoded)

      return { success: true, data: decoded }
    } catch (err) {
      if (verbose) console.log("← read error:", err)
      
      if (!(err instanceof CallExecutionError)) {
        return { success: false, error: { name: "UnknownError", args: [String(err)] } }
      }

      const revertData = extractRevertData(err)
      if (!revertData) {
        return { success: false, error: { name: "NoRevertData", args: [] } }
      }

      try {
        const { errorName, args: errorArgs } = decodeErrorResult({
          abi,
          data: revertData,
        })

        return {
          success: false,
          error: {
            name: errorName,
            args: Array.isArray(errorArgs) ? [...errorArgs] : [],
          },
        }
      } catch (decodeErr) {
        if (verbose) console.log("← failed to decode error:", decodeErr)
        return { success: false, error: { name: "DecodeError", args: [] } }
      }
    }
  }

  const write = async (
    walletClient: WalletClient, 
    functionName: string, 
    args: ContractArgs = []
  ): Promise<ContractWriteResult> => {
    try {
      if (!walletClient.account) {
        return { success: false, error: { name: "NoAccount", args: [] } }
      }

      const data = encodeFunctionData({ abi, functionName, args })
      if (verbose) console.log("→ write calldata:", data)

      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName,
        args,
        account: walletClient.account,
        chain: publicClient.chain,
      })

      // Ensure the request uses the correct chain
      const correctedRequest = {
        ...request,
        chain: publicClient.chain,
      };

      const txHash = await walletClient.writeContract(correctedRequest)
      if (verbose) console.log("← transaction hash:", txHash)

      return { success: true, txHash }
    } catch (err) {
      if (verbose) console.log("← write error:", err)

      if (!(err instanceof ContractFunctionExecutionError)) {
        return { success: false, error: { name: "UnknownWriteError", args: [String(err)] } }
      }

      const errAny = err as any
      if (errAny.data && typeof errAny.data === "object" && "errorName" in errAny.data) {
        const errorData = errAny.data
        return {
          success: false,
          error: {
            name: errorData.errorName,
            args: Array.isArray(errorData.args) ? [...errorData.args] : [],
          },
        }
      }

      const revertData = extractRevertData(err)
      if (!revertData) {
        return { success: false, error: { name: "NoRevertData", args: [] } }
      }

      try {
        const { errorName, args: errorArgs } = decodeErrorResult({ 
          abi, 
          data: revertData 
        })
        
        return {
          success: false,
          error: {
            name: errorName,
            args: Array.isArray(errorArgs) ? [...errorArgs] : [],
          },
        }
      } catch (decodeErr) {
        if (verbose) console.log("← failed to decode write error:", decodeErr)
        return { success: false, error: { name: "DecodeError", args: [] } }
      }
    }
  }

  const getContractInfo = async () => {
    try {
      const code = await publicClient.getBytecode({ address: contractAddress })
      return {
        hasCode: code && code !== "0x",
        address: contractAddress,
      }
    } catch (err) {
      if (verbose) console.log("← getContractInfo error:", err)
      return {
        hasCode: false,
        address: contractAddress,
      }
    }
  }

  return {
    read,
    write,
    getContractInfo,
    address: contractAddress,
    abi,
  }
}

function extractRevertData(err: any): Hex | undefined {
  if (err instanceof BaseError) {
    const revertError = err.walk((e) => e instanceof ContractFunctionRevertedError)
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorData = revertError.data
      if (errorData && typeof errorData === "object" && "data" in errorData) {
        return (errorData as any).data as Hex
      }
    }
  }

  if (err.cause && typeof err.cause === "object") {
    const cause = err.cause as any

    if (cause.cause && typeof cause.cause === "object" && "data" in cause.cause) {
      const deepCauseData = cause.cause.data
      if (typeof deepCauseData === "string" && deepCauseData.startsWith("0x")) {
        return deepCauseData as Hex
      }
    }

    if ("data" in cause) {
      const causeData = cause.data
      if (typeof causeData === "string" && causeData.startsWith("0x")) {
        return causeData as Hex
      }
    }
  }

  if (err.details) {
    const detailsMatch = err.details.match(/0x[a-fA-F0-9]+/)
    if (detailsMatch) {
      return detailsMatch[0] as Hex
    }
  }

  return undefined
}

export type ContractService = ReturnType<typeof createContractService> 