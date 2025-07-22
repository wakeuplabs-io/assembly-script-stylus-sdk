import { useState, useMemo } from 'react'
import type { Address, Abi } from 'viem'
import { createContractService, type ContractArgs } from '@/lib/contract-service'

interface UseContractProps {
  address?: Address
  abi: Abi
  enabled?: boolean
}

export function useContract({ address, abi, enabled = true }: UseContractProps) {
  // Por ahora sin wallet client hasta que se configure wagmi correctamente
  const walletClient = null
  const [isLoading, setIsLoading] = useState(false)

  // Crear servicio de contrato
  const contractService = useMemo(() => {
    if (!address || !enabled) return null
    return createContractService(address, abi, true)
  }, [address, abi, enabled])

  // Función para leer del contrato
  const read = async (functionName: string, args: ContractArgs = []) => {
    if (!contractService) {
      throw new Error('Contract service not initialized')
    }

    setIsLoading(true)
    try {
      const result = await contractService.read(functionName, args)
      return result
    } finally {
      setIsLoading(false)
    }
  }

  // Función para escribir al contrato
  const write = async (functionName: string, args: ContractArgs = []) => {
    if (!contractService) {
      throw new Error('Contract service not initialized')
    }

    if (!walletClient) {
      return {
        success: false,
        error: { name: 'WalletNotConnected', args: ['Please connect a wallet to perform write operations'] }
      }
    }

    setIsLoading(true)
    try {
      const result = await contractService.write(walletClient, functionName, args)
      return result
    } finally {
      setIsLoading(false)
    }
  }

  // Función para obtener información del contrato
  const getContractInfo = async () => {
    if (!contractService) {
      throw new Error('Contract service not initialized')
    }

    return contractService.getContractInfo()
  }

  return {
    read,
    write,
    getContractInfo,
    isLoading,
    isConnected: !!walletClient,
    contractService,
  }
} 