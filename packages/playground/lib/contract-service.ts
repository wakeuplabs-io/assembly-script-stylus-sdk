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
import { arbitrumSepolia } from "viem/chains"

// Configuración del cliente público para Arbitrum Sepolia
const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http("https://sepolia-rollup.arbitrum.io/rpc"),
})

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

/**
 * Servicio de contrato para interactuar con contratos Stylus
 */
export function createContractService(contractAddress: Address, abi: Abi, verbose: boolean = false) {
  
  /**
   * Función para leer datos del contrato (view/pure functions)
   */
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

      // Intentar extraer datos de revert
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

  /**
   * Función para escribir al contrato (transacciones)
   */
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

      // Simular la transacción primero
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName,
        args,
        account: walletClient.account,
      })

      // Ejecutar la transacción
      const txHash = await walletClient.writeContract(request)
      if (verbose) console.log("← transaction hash:", txHash)

      return { success: true, txHash }
    } catch (err) {
      if (verbose) console.log("← write error:", err)

      if (!(err instanceof ContractFunctionExecutionError)) {
        return { success: false, error: { name: "UnknownWriteError", args: [String(err)] } }
      }

      // Intentar extraer información del error
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

      // Intentar extraer datos de revert
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

  /**
   * Función para obtener información básica del contrato
   */
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

/**
 * Función helper para extraer datos de revert de errores
 */
function extractRevertData(err: any): Hex | undefined {
  // Intentar extraer de BaseError
  if (err instanceof BaseError) {
    const revertError = err.walk((e) => e instanceof ContractFunctionRevertedError)
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorData = revertError.data
      if (errorData && typeof errorData === "object" && "data" in errorData) {
        return (errorData as any).data as Hex
      }
    }
  }

  // Intentar extraer del cause
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

  // Intentar extraer de details
  if (err.details) {
    const detailsMatch = err.details.match(/0x[a-fA-F0-9]+/)
    if (detailsMatch) {
      return detailsMatch[0] as Hex
    }
  }

  return undefined
}

export type ContractService = ReturnType<typeof createContractService> 