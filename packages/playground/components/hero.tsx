"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { useGSAP } from "@/hooks/use-gsap"

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const { gsap } = window
    if (!gsap || !headlineRef.current || !glowRef.current) return

    // Hero glow animation
    gsap.fromTo(
      glowRef.current,
      { filter: "brightness(0.8)" },
      {
        filter: "brightness(1.2)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        duration: 2,
      },
    )

    // Headline entrance - immediate visibility
    gsap.fromTo(headlineRef.current, {
      y: 20,
      opacity: 0.8,
    }, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      delay: 0.1,
      ease: "power2.out",
    })

    // Subtitle and buttons - immediate visibility
    gsap.fromTo(".hero-subtitle, .hero-buttons", {
      y: 15,
      opacity: 0.8,
    }, {
      y: 0,
      opacity: 1,
      duration: 0.6,
      delay: 0.3,
      stagger: 0.1,
      ease: "power2.out",
    })
  }, [])

  const scrollToPlayground = () => {
    document.getElementById("playground")?.scrollIntoView({ behavior: "smooth" })
  }

  const scrollToQuickstart = () => {
    document.getElementById("quickstart")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center px-4">
      <div
        ref={glowRef}
        className="absolute inset-0 bg-gradient-radial from-blue-500/10 via-transparent to-transparent"
      />

      <div className="text-center max-w-4xl mx-auto relative z-10">
        <h1
          ref={headlineRef}
          className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent"
        >
          Write Stylus contracts in TypeScript.
        </h1>

        <p className="hero-subtitle text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
          ERC-20, ERC-721 and custom logic. No Solidity. No Rust.
        </p>

        <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={scrollToPlayground}
            size="lg"
            className="bg-[#12aaff] hover:bg-[#0e8fd8] text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-[#12aaff]/25 transition-all duration-300"
          >
            Try live contract
          </Button>
          <Button
            onClick={scrollToQuickstart}
            variant="outline"
            size="lg"
            className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3 text-lg font-semibold bg-transparent"
          >
            Quick start
          </Button>
        </div>
      </div>
    </section>
  )
}
