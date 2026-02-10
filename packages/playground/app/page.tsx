"use client"

import { Hero } from "@/components/hero"
import { ContractSelector } from "@/components/contract-selector"
import { FlowDiagram } from "@/components/flow-diagram"
import { Playground } from "@/components/playground"
import { ContractInteraction } from "@/components/contract-interaction"
import { AbiExplorer } from "@/components/abi-explorer"
import { UnderTheHood } from "@/components/under-the-hood"
import { BottomCTA } from "@/components/bottom-cta"
import { ContractProvider, useContract } from "@/contexts/contract-context"

function HomeContent() {
  const { activeContract } = useContract()
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0E0E10] via-[#111417] to-[#0C111C] text-white">
      <Hero />
      <ContractSelector />
      <FlowDiagram />
      <Playground />
      <AbiExplorer />
      <ContractInteraction />
      <UnderTheHood contractType={activeContract} />
      <BottomCTA />
    </main>
  )
}

export default function Home() {
  return (
    <ContractProvider>
      <HomeContent />
    </ContractProvider>
  )
}
