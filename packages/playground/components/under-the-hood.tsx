"use client"

import { useRef } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CodeBlock } from "@/components/code-block"
import { useGSAP } from "@/hooks/use-gsap"

const entrypointCode = `// user_entrypoint.ts - Auto-generated
import { Contract } from './contract'

export function user_entrypoint(selector: u32): void {
  const contract = new Contract()
  
  switch (selector) {
    case 0x06fdde03: // name()
      contract.name()
      break
    case 0x70a08231: // balanceOf(address)
      contract.balanceOf()
      break
    case 0xa9059cbb: // transfer(address,uint256)
      contract.transfer()
      break
    default:
      throw new Error('Unknown selector')
  }
}`

const selectorsCode = `{
  "name": "0x06fdde03",
  "symbol": "0x95d89b41", 
  "balanceOf": "0x70a08231",
  "transfer": "0xa9059cbb",
  "approve": "0x095ea7b3"
}`

export function UnderTheHood() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const { gsap, ScrollTrigger } = window
    if (!gsap || !ScrollTrigger || !containerRef.current) return

    gsap.fromTo(
      containerRef.current,
      { y: 20, opacity: 0.8 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
      },
    )
  }, [])

  return (
    <section className="py-20 px-4 bg-black/20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Curious what gets compiled?</h2>
        <p className="text-gray-400 text-center mb-16">Peek under the hood to see the generated artifacts</p>

        <div ref={containerRef}>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="entrypoint" className="bg-gray-900/50 border-gray-700 rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-arbitrum-primary-light">Generated entrypoint</AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-400 mb-4">The main entry point that routes function calls based on selectors</p>
                <CodeBlock code={entrypointCode} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="selectors" className="bg-gray-900/50 border-gray-700 rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-arbitrum-primary-light">Selectors</AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-400 mb-4">Function name to 4-byte selector mapping</p>
                <CodeBlock code={selectorsCode} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="wasm" className="bg-gray-900/50 border-gray-700 rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-arbitrum-primary-light">WASM artifact</AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-400 mb-4">Compiled WebAssembly binary ready for deployment</p>
                <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl">📦</div>
                  <div>
                    <p className="text-white font-medium">erc20.wasm</p>
                    <p className="text-gray-400 text-sm">42.3 KB • Optimized build</p>
                  </div>
                  <button className="ml-auto text-arbitrum-primary-light hover:text-arbitrum-primary">Download</button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  )
}
