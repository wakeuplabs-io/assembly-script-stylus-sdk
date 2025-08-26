"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CodeBlock } from "@/components/code-block"
import { Prerequisites } from "@/components/prerequisites"
import { ERC20_CONTRACT_CODE, ERC721_CONTRACT_CODE } from "@/lib/constants/code-examples"
import { ONBOARDING_STEPS } from "@/lib/constants/onboarding"
import { useContract } from "@/contexts/contract-context"
import { Copy, Check, ArrowRight } from "lucide-react"
import { useState } from "react"

export function Playground() {
  const { activeContract } = useContract()
  const [copiedStates, setCopiedStates] = useState<Record<string | number, boolean>>({})

  const copyCommand = async (command: string, index: number | string) => {
    try {
      await navigator.clipboard.writeText(command)
      setCopiedStates(prev => ({ ...prev, [index]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [index]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <section id="playground" className="py-20 px-4 bg-black/20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Up and running in under 60s</h2>
        <p className="text-gray-400 text-center mb-8">Three commands to deploy your first Stylus contract</p>

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center px-6 py-3 bg-gray-800 border border-gray-700 rounded-full">
            <span className="text-gray-400 mr-2">Working with:</span>
            <span className="text-stylus-primary-light font-medium">{activeContract} Contract</span>
          </div>
        </div>

        <Prerequisites />

        <Card className="bg-gray-900/50 border-gray-700 overflow-hidden">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-2">
              <div className="border-r border-gray-700">
                <CodeBlock
                  code={activeContract === "ERC20" ? ERC20_CONTRACT_CODE : ERC721_CONTRACT_CODE}
                  showCopy
                  height="54rem"
                />
              </div>

              <div className="p-8 flex flex-col justify-center">
                <div className="space-y-6">
                  {ONBOARDING_STEPS.map((step, index) => (
                    <div key={index} className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">{step.step}</h3>
                      {step.description && <p className="text-gray-400 text-sm">{step.description}</p>}
                      
                      {index === 1 && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3">
                          <div className="flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-blue-100 text-sm font-medium mb-1">Important Step</p>
                              <p className="text-blue-200 text-xs leading-relaxed">
                                After opening your project, copy the contract code from the left panel and replace the entire contents of <code className="bg-blue-400/20 px-1 rounded">contract.ts</code>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {step.command && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mt-2 flex items-center">
                          <code className="text-white font-mono text-sm flex-1">{step.command}</code>
                          <button
                            onClick={() => copyCommand(step.command, index)}
                            className="ml-2 p-1 rounded hover:bg-gray-700 transition flex items-center"
                            aria-label="Copiar comando"
                          >
                            {copiedStates[index] ? (
                              <>
                                <Check className="w-4 h-4 text-green-400 mr-1" />
                                <span className="text-green-400 text-xs">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1" />
                                <span className="text-xs">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      
                      {/* Enhanced RPC hint for Step 4 */}
                      {step.hint && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mt-2">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <p className="text-green-100 text-sm font-medium mb-1">Recommended RPC Endpoint</p>
                              <div className="flex items-center gap-2 bg-green-500/20 rounded px-2 py-1">
                                <code className="text-green-100 text-xs font-mono">{step.hint?.replace('Arbitrum Sepolia RPC: ', '') || ''}</code>
                                <button
                                  onClick={() => copyCommand(step.hint?.replace('Arbitrum Sepolia RPC: ', '') || '', `rpc-${index}`)}
                                  className="p-1 rounded hover:bg-green-500/30 transition"
                                  aria-label="Copy RPC URL"
                                >
                                  {copiedStates[`rpc-${index}`] ? (
                                    <Check className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-green-200" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
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
