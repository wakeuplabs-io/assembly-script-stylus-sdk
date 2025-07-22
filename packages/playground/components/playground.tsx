"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CodeBlock } from "@/components/code-block"
import { ERC20_CONTRACT_CODE, ERC721_CONTRACT_CODE } from "@/lib/constants/code-examples"
import { ONBOARDING_STEPS } from "@/lib/constants/onboarding"
import { useContract } from "@/contexts/contract-context"

export function Playground() {
  const { activeContract } = useContract()

  return (
    <section id="playground" className="py-20 px-4 bg-black/20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Up and running in under 60s</h2>
        <p className="text-gray-400 text-center mb-8">Three commands to deploy your first Stylus contract</p>

        {/* Indicador del contrato actual */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center px-6 py-3 bg-gray-800 border border-gray-700 rounded-full">
            <span className="text-gray-400 mr-2">Working with:</span>
            <span className="text-[#ac1c5e] font-medium">{activeContract} Contract</span>
          </div>
        </div>

        <Card className="bg-gray-900/50 border-gray-700 overflow-hidden">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-2">
              <div className="border-r border-gray-700">
                <CodeBlock
                  code={activeContract === "ERC20" ? ERC20_CONTRACT_CODE : ERC721_CONTRACT_CODE}
                  showCopy
                  height="600px"
                />
              </div>

              <div className="p-8 flex flex-col justify-center">
                <div className="space-y-6">
                  {ONBOARDING_STEPS.map((step, index) => (
                    <div key={index} className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">{step.step}</h3>
                      {step.description && <p className="text-gray-400 text-sm">{step.description}</p>}
                      {step.command && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mt-2">
                          <code className="text-[#bf2968] font-mono text-sm">{step.command}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
