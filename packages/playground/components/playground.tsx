"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CodeBlock } from "@/components/code-block"
import { ERC20_CONTRACT_CODE, ERC721_CONTRACT_CODE } from "@/lib/constants/code-examples"
import { ONBOARDING_STEPS } from "@/lib/constants/onboarding"

export function Playground() {
  const [activeContract, setActiveContract] = useState<"ERC20" | "ERC721">("ERC20")

  return (
    <section id="playground" className="py-20 px-4 bg-black/20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Up and running in under 60s</h2>
        <p className="text-gray-400 text-center mb-16">Three commands to deploy your first Stylus contract</p>

        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 p-1 rounded-full border border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveContract("ERC20")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeContract === "ERC20" ? "bg-[#ac1c5e] text-white shadow-lg" : "text-gray-400 hover:text-gray-300"
                }`}
              >
                ERC20
              </button>
              <button
                onClick={() => setActiveContract("ERC721")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeContract === "ERC721" ? "bg-[#ac1c5e] text-white shadow-lg" : "text-gray-400 hover:text-gray-300"
                }`}
              >
                ERC721
              </button>
            </div>
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
