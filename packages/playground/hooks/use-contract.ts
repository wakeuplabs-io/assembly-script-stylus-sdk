import { useState, useEffect } from 'react'
import { useWalletClient, useAccount } from 'wagmi'
import type { Address, Abi } from 'viem'
import { createContractService, type ContractArgs } from '@/lib/contract-service'
import { useContract as useContractContext } from '@/contexts/contract-context'

interface UseContractProps {
  address?: Address
  abi: Abi
  enabled?: boolean
}

export function useContract({ address, abi, enabled = true }: UseContractProps) {
  const { data: walletClient } = useWalletClient()
  const { isConnected } = useAccount()
  const { rpcEndpoint } = useContractContext()
  const [isLoading, setIsLoading] = useState(false)
  const [contractService, setContractService] = useState<Awaited<ReturnType<typeof createContractService>> | null>(null)

  useEffect(() => {
    if (!address || !enabled) {
      setContractService(null)
      return
    }

    let isCancelled = false

    const initializeContractService = async () => {
      try {
        const service = await createContractService(address, abi, rpcEndpoint, true)
        if (!isCancelled) {
          setContractService(service)
        }
      } catch (error) {
        console.error('Failed to initialize contract service:', error)
        if (!isCancelled) {
          setContractService(null)
        }
      }
    }

    initializeContractService()

    return () => {
      isCancelled = true
    }
  }, [address, abi, rpcEndpoint, enabled])

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