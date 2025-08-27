"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

type ContractType = "ERC20" | "ERC721"

interface ContractContextType {
  activeContract: ContractType
  setActiveContract: (contract: ContractType) => void
  rpcEndpoint: string
  setRpcEndpoint: (endpoint: string) => void
  blockExplorerUrl: string
  setBlockExplorerUrl: (url: string) => void
}

const ContractContext = createContext<ContractContextType | undefined>(undefined)

export function useContract() {
  const context = useContext(ContractContext)
  if (context === undefined) {
    throw new Error('useContract must be used within a ContractProvider')
  }
  return context
}

interface ContractProviderProps {
  children: ReactNode
}

export function ContractProvider({ children }: ContractProviderProps) {
  const [activeContract, setActiveContract] = useState<ContractType>("ERC20")
  const [rpcEndpoint, setRpcEndpoint] = useState<string>("https://sepolia-rollup.arbitrum.io/rpc")
  const [blockExplorerUrl, setBlockExplorerUrl] = useState<string>("https://sepolia.arbiscan.io/")

  return (
    <ContractContext.Provider value={{ 
      activeContract, 
      setActiveContract, 
      rpcEndpoint, 
      setRpcEndpoint, 
      blockExplorerUrl, 
      setBlockExplorerUrl 
    }}>
      {children}
    </ContractContext.Provider>
  )
} 