"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

type ContractType = "ERC20" | "ERC721"

interface ContractContextType {
  activeContract: ContractType
  setActiveContract: (contract: ContractType) => void
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

  return (
    <ContractContext.Provider value={{ activeContract, setActiveContract }}>
      {children}
    </ContractContext.Provider>
  )
} 