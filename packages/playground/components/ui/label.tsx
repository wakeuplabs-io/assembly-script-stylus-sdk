"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string
}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label className={cn(labelVariants(), className)} {...props}>
      {children}
    </label>
  )
}
