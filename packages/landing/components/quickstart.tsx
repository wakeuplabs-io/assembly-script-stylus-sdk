"use client"

import { useRef } from "react"
import { useGSAP } from "@/hooks/use-gsap"
import { CodeBlock } from "@/components/code-block"

const commands = [
  {
    title: "Generate contract",
    code: "npx as-sdk generate erc20",
    description: "Create a new ERC-20 contract template",
  },
  {
    title: "Build contract",
    code: "cd contracts/erc20 && npx as-sdk build",
    description: "Compile TypeScript to WASM",
  },
  {
    title: "Deploy contract",
    code: "npx as-sdk deploy",
    description: "Deploy to Arbitrum network",
  },
]

export function Quickstart() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const { gsap, ScrollTrigger } = window
    if (!gsap || !ScrollTrigger || !containerRef.current) return

    const blocks = containerRef.current.querySelectorAll(".quickstart-block")

    blocks.forEach((block, index) => {
      gsap.fromTo(
        block,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: index * 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: block,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      )
    })
  }, [])

  return (
    <section id="quickstart" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Up and running in under 60s</h2>
        <p className="text-gray-400 text-center mb-16">Three commands to deploy your first Stylus contract</p>

        <div ref={containerRef} className="space-y-8">
          {commands.map((command, index) => (
            <div key={index} className="quickstart-block">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{command.title}</h3>
                  <p className="text-gray-400">{command.description}</p>
                </div>
              </div>
              <CodeBlock code={command.code} language="bash" showCopy />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
