"use client"

import { useRef } from "react"
import { useGSAP } from "@/hooks/use-gsap"

export function FlowDiagram() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const { gsap, ScrollTrigger } = window
    if (!gsap || !ScrollTrigger || !containerRef.current) return

    const connectors = containerRef.current.querySelectorAll(".flow-connector")

    // Animate nodes on scroll
    gsap.fromTo(
      `.flow-node`,
      { scale: 0.8, opacity: 0.7 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        delay: 0.2,
        stagger: 0.1,
        ease: "back.out(1.7)",
      },
    )

    // Animate connectors with stroke reveal
    connectors.forEach((connector, index) => {
      gsap.fromTo(
        connector,
        { strokeDashoffset: 100 },
        {
          strokeDashoffset: 0,
          duration: 1,
          delay: (index + 1) * 0.3,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: connector,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      )
    })
  }, [])

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">From TypeScript to Stylus in seconds</h2>

        <div ref={containerRef} className="relative">
          <svg viewBox="0 0 1000 200" className="w-full h-48">
            {/* Connectors */}
            <path
              className="flow-connector"
              d="M 180 100 L 220 100"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeDasharray="10,5"
              fill="none"
            />
            <path
              className="flow-connector"
              d="M 380 100 L 420 100"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeDasharray="10,5"
              fill="none"
            />
            <path
              className="flow-connector"
              d="M 580 100 L 620 100"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeDasharray="10,5"
              fill="none"
            />
            <path
              className="flow-connector"
              d="M 780 100 L 820 100"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeDasharray="10,5"
              fill="none"
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-between px-4">
            {[
              { title: "TypeScript", desc: "Write contracts" },
              { title: "as-sdk build", desc: "Compile" },
              { title: "WASM + ABI", desc: "Generate" },
              { title: "Deploy", desc: "To Arbitrum" },
              { title: "Interact", desc: "Call functions" },
            ].map((step, index) => (
              <div key={index} className="flow-node text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mb-3 mx-auto shadow-lg">
                  <span className="text-white font-bold">{index + 1}</span>
                </div>
                <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
