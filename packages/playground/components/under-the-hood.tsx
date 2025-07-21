"use client"

import { useRef } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CodeBlock } from "@/components/code-block"
import { useGSAP } from "@/hooks/use-gsap"
import gsap from "gsap"
import { ENTRYPOINT_CODE, SELECTORS_CODE } from "@/lib/constants/code-examples"
import { UNDER_THE_HOOD_TITLE, UNDER_THE_HOOD_SUBTITLE, ACCORDION_ITEMS } from "@/lib/constants/ui-content"



export function UnderTheHood() {
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

  return (
    <section className="py-20 px-4 bg-black/20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{UNDER_THE_HOOD_TITLE}</h2>
        <p className="text-gray-400 text-center mb-16">{UNDER_THE_HOOD_SUBTITLE}</p>

        <div ref={containerRef}>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="entrypoint" className="bg-gray-900/50 border-gray-700 rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-stylus-primary-light">{ACCORDION_ITEMS.ENTRYPOINT.title}</AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-400 mb-4">{ACCORDION_ITEMS.ENTRYPOINT.description}</p>
                <CodeBlock code={ENTRYPOINT_CODE} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="selectors" className="bg-gray-900/50 border-gray-700 rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-stylus-primary-light">{ACCORDION_ITEMS.SELECTORS.title}</AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-400 mb-4">{ACCORDION_ITEMS.SELECTORS.description}</p>
                <CodeBlock code={SELECTORS_CODE} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="wasm" className="bg-gray-900/50 border-gray-700 rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-stylus-primary-light">{ACCORDION_ITEMS.WASM.title}</AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-400 mb-4">{ACCORDION_ITEMS.WASM.description}</p>
                <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl">📦</div>
                  <div>
                    <p className="text-white font-medium">erc20.wasm</p>
                    <p className="text-gray-400 text-sm">42.3 KB • Optimized build</p>
                  </div>
                  <button className="ml-auto text-stylus-primary-light hover:text-stylus-primary">Download</button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  )
}
