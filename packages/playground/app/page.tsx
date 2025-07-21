import { Hero } from "@/components/hero"
import { FlowDiagram } from "@/components/flow-diagram"
import { Playground } from "@/components/playground"
import { ContractInteraction } from "@/components/contract-interaction"
import { UnderTheHood } from "@/components/under-the-hood"
import { BottomCTA } from "@/components/bottom-cta"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0E0E10] via-[#111417] to-[#0C111C] text-white">
      <Hero />
      <FlowDiagram />
      <Playground />
      <ContractInteraction />
      <UnderTheHood />
      <BottomCTA />
    </main>
  )
}
