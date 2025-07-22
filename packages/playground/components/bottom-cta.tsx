"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useGSAP } from "@/hooks/use-gsap"
import { Github, ArrowRight } from "lucide-react"

export function BottomCTA() {
  const cardRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const { gsap } = window
    if (!gsap || !cardRef.current) return

    // Infinite neon border glow
    gsap.to(cardRef.current, {
      boxShadow: "0 0 24px #3B82F6, 0 0 48px #3B82F6",
      repeat: -1,
      yoyo: true,
      duration: 3,
      ease: "sine.inOut",
    })
  }, [])

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Card
          ref={cardRef}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-[#ac1c5e]/30 shadow-2xl"
        >
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready for your first deploy?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Start building Stylus contracts with TypeScript today. No Rust knowledge required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-[#ac1c5e] hover:bg-[#972054] text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-[#ac1c5e]/25 transition-all duration-300"
              >
                <Github className="w-5 h-5 mr-2" />
                Go to GitHub
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg font-semibold bg-transparent"
              >
                Read Documentation
              </Button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-700">
              <p className="text-gray-400">Join 500+ developers building the future of smart contracts</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
