"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    gsap: any
    ScrollTrigger: any
  }
}

export function useGSAP(callback: () => void, deps: any[] = []) {
  useEffect(() => {
    // Load GSAP dynamically
    const loadGSAP = async () => {
      if (typeof window === "undefined") return

      try {
        const gsap = await import("gsap")
        const ScrollTrigger = await import("gsap/ScrollTrigger")

        gsap.default.registerPlugin(ScrollTrigger.default)

        window.gsap = gsap.default
        window.ScrollTrigger = ScrollTrigger.default

        callback()
      } catch (error) {
        console.warn("GSAP not available, animations disabled")
      }
    }

    loadGSAP()
  }, deps)
}
