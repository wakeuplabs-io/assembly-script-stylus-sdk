import { useState, useMemo } from 'react'
import { useWalletClient, useAccount } from 'wagmi'
import type { Address, Abi } from 'viem'
import { createContractService, type ContractArgs } from '@/lib/contract-service'

interface UseContractProps {
  address?: Address
  abi: Abi
  enabled?: boolean
}

export function useContract({ address, abi, enabled = true }: UseContractProps) {
  const { data: walletClient } = useWalletClient()
  const { isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)

  const contractService = useMemo(() => {
    if (!address || !enabled) return null
    return createContractService(address, abi, true)
  }, [address, abi, enabled])

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

  const write = async (functionName: string, args: ContractArgs = []) => {
    if (!contractService) {
      throw new Error('Contract service not initialized')
    }

    if (!walletClient) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    try {
      const result = await contractService.write(walletClient, functionName, args)
      return result
    } finally {
      setIsLoading(false)
    }
  }

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
    isConnected,
    contractService,
  }
} 