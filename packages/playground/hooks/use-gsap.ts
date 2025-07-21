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
    const checkGSAP = () => {
      if (typeof window === "undefined") return

      // Check if GSAP is loaded from CDN
      if (window.gsap && window.ScrollTrigger) {
        callback()
      } else {
        // Wait a bit more for GSAP to load
        setTimeout(checkGSAP, 100)
      }
    }

    // Start checking after a short delay
    setTimeout(checkGSAP, 500)
  }, deps)
}
