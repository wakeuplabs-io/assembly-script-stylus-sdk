"use client"

import { useRef } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CodeBlock } from "@/components/code-block"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useGSAP } from "@/hooks/use-gsap"
import gsap from "gsap"
import { 
  ERC20_ENTRYPOINT_CODE, 
  ERC20_CONTRACT_TRANSFORMED,
  ERC721_ENTRYPOINT_CODE,
  ERC721_CONTRACT_TRANSFORMED 
} from "@/lib/constants/code-examples"
import { UNDER_THE_HOOD_TITLE, UNDER_THE_HOOD_SUBTITLE, ACCORDION_ITEMS } from "@/lib/constants/ui-content"

interface UnderTheHoodProps {
  contractType: "ERC20" | "ERC721"
}

export function UnderTheHood({ contractType }: UnderTheHoodProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return

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

  const entrypointCode = contractType === "ERC20" ? ERC20_ENTRYPOINT_CODE : ERC721_ENTRYPOINT_CODE
  const transformedCode = contractType === "ERC20" ? ERC20_CONTRACT_TRANSFORMED : ERC721_CONTRACT_TRANSFORMED
  const wasmFile = contractType === "ERC20" ? "erc20" : "erc721"

  const handleDownload = (fileType: 'wasm' | 'wat') => {
    const link = document.createElement('a')
    link.href = `/wats/${wasmFile}.${fileType}`
    link.download = `${wasmFile}.${fileType}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <section className="py-20 px-4 bg-black/20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{UNDER_THE_HOOD_TITLE}</h2>
        <p className="text-gray-400 text-center mb-8">{UNDER_THE_HOOD_SUBTITLE}</p>

        {/* Indicador sutil del contrato actual */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center px-6 py-3 bg-gray-800 border border-gray-700 rounded-full">
            <span className="text-gray-400 mr-2">Analyzing:</span>
            <span className="text-[#ac1c5e] font-medium">{contractType} Contract</span>
          </div>
        </div>

        <div ref={containerRef}>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="entrypoint" className="bg-gray-900/50 border-gray-700 rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-stylus-primary-light">
                {ACCORDION_ITEMS.ENTRYPOINT.title}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-400 mb-4">{ACCORDION_ITEMS.ENTRYPOINT.description}</p>
                <CodeBlock code={entrypointCode} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="selectors" className="bg-gray-900/50 border-gray-700 rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-stylus-primary-light">
                {ACCORDION_ITEMS.CONTRACT_TRANSFORMED.title}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-400 mb-4">{ACCORDION_ITEMS.CONTRACT_TRANSFORMED.description}</p>
                <CodeBlock code={transformedCode} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="wasm" className="bg-gray-900/50 border-gray-700 rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-stylus-primary-light">
                {ACCORDION_ITEMS.WASM.title}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-400 mb-4">
                  WebAssembly Text (WAT) format for better readability. The compiled binary versions are also available for download.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                    <div className="text-2xl">📄</div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{wasmFile}.wat</p>
                      <p className="text-gray-400 text-sm">WebAssembly Text format • Human readable</p>
                    </div>
                    <Button
                      onClick={() => handleDownload('wat')}
                      size="sm"
                      className="bg-stylus-primary hover:bg-stylus-primary-dark text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download WAT
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                    <div className="text-2xl">📦</div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{wasmFile}.wasm</p>
                      <p className="text-gray-400 text-sm">WebAssembly Binary • Optimized for deployment</p>
                    </div>
                    <Button
                      onClick={() => handleDownload('wasm')}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download WASM
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  )
}
