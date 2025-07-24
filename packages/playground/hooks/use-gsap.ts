"use client"

import { useEffect } from "react"
import gsap from "gsap"
import ScrollTrigger from "gsap/ScrollTrigger"
import type { DependencyList } from "react"

export const useGSAP = (cb: () => void, deps: DependencyList = []) => {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    cb()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
