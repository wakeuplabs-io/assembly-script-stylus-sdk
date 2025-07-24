"use client"

import { useRef } from "react"
import gsap from "gsap"
import ScrollTrigger from "gsap/ScrollTrigger"
import { useGSAP } from "@/hooks/use-gsap"
import { FLOW_STEPS, FLOW_DIAGRAM_TITLE } from "@/lib/constants/ui-content"

type FlowElement = {
  type: 'step'
  data: typeof FLOW_STEPS[0]
  index: number
} | {
  type: 'arrow'
  index: number
}

export function FlowDiagram() {
  const container = useRef<HTMLDivElement>(null)

  const flowElements: FlowElement[] = []
  for (let i = 0; i < FLOW_STEPS.length; i++) {
    flowElements.push({
      type: 'step',
      data: FLOW_STEPS[i],
      index: i
    })
    
    if (i < FLOW_STEPS.length - 1) {
      flowElements.push({
        type: 'arrow',
        index: i
      })
    }
  }

  useGSAP(() => {
    if (!container.current) return
    gsap.registerPlugin(ScrollTrigger)

    gsap.fromTo(
      container.current.querySelectorAll(".flow-step"),
      { y: 40, opacity: 0, scale: 0.8 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: "back.out(1.4)",
        scrollTrigger: { 
          trigger: container.current, 
          start: "top 85%",
          toggleActions: "play none none reverse"
        },
      },
    )

    gsap.fromTo(
      container.current.querySelectorAll(".flow-arrow"),
      { 
        scaleX: 0,
        opacity: 0,
        transformOrigin: "left center" 
      },
      {
        scaleX: 1,
        opacity: 1,
        duration: 0.6,
        stagger: 0.3,
        delay: 0.4,
        ease: "power2.inOut",
        scrollTrigger: { 
          trigger: container.current, 
          start: "top 85%",
          toggleActions: "play none none reverse"
        },
      }
    )
  }, [])

  return (
    <section id="flow-diagram" className="py-20 px-4 overflow-hidden">
      <h2 className="text-center text-3xl md:text-4xl font-bold mb-16 bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent">
        {FLOW_DIAGRAM_TITLE}
      </h2>

      <div ref={container} className="relative max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6">
          {flowElements.map((element) => {
            if (element.type === 'step') {
              return (
                <div key={`step-${element.index}`} className="flow-step text-center">
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300" />
                    
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto rounded-full bg-gradient-to-br from-pink-500/20 to-pink-700/20 border-2 border-pink-500/60 shadow-xl backdrop-blur-sm flex items-center justify-center group-hover:border-pink-400 transition-all duration-300">
                      <span className="text-white font-bold text-lg sm:text-xl md:text-2xl">
                        {element.index + 1}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 max-w-[120px] sm:max-w-[140px]">
                    <h3 className="font-semibold text-white text-sm sm:text-base mb-1">
                      {element.data.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-tight">
                      {element.data.desc}
                    </p>
                  </div>
                </div>
              )
            } else {
              return (
                <div key={`arrow-${element.index}`} className="flow-arrow flex items-center self-start mt-8 sm:mt-10 md:mt-12">
                  <div className="flex items-center">
                    <div className="w-6 sm:w-8 md:w-12 h-1 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full shadow-md" />
                    <div className="-ml-2 relative">
                      <div className="w-0 h-0 
                        border-t-[6px] border-t-transparent
                        border-b-[6px] border-b-transparent
                        border-l-[10px] border-l-pink-600
                        drop-shadow-sm
                        sm:border-t-[8px] sm:border-b-[8px] sm:border-l-[12px]
                      " />
                    </div>
                  </div>
                </div>
              )
            }
          })}
        </div>
      </div>
    </section>
  )
}
