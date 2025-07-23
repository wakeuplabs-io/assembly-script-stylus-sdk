"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionContextType {
  openItems: Set<string>
  toggleItem: (value: string) => void
  type: "single" | "multiple"
  collapsible?: boolean
}

const AccordionContext = React.createContext<AccordionContextType | null>(null)

interface AccordionProps {
  type: "single" | "multiple"
  collapsible?: boolean
  className?: string
  children: React.ReactNode
}

function Accordion({ type, collapsible, className, children }: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set())

  const toggleItem = (value: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (type === "single") {
        if (newSet.has(value)) {
          if (collapsible) {
            newSet.clear()
          }
        } else {
          newSet.clear()
          newSet.add(value)
        }
      } else {
        if (newSet.has(value)) {
          newSet.delete(value)
        } else {
          newSet.add(value)
        }
      }
      return newSet
    })
  }

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type, collapsible }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps {
  value: string
  className?: string
  children: React.ReactNode
}

function AccordionItem({ value, className, children }: AccordionItemProps) {
  return (
    <div className={cn("border-b", className)} data-value={value}>
      {children}
    </div>
  )
}

interface AccordionTriggerProps {
  className?: string
  children: React.ReactNode
}

function AccordionTrigger({ className, children }: AccordionTriggerProps) {
  const context = React.useContext(AccordionContext)
  const parent = React.useContext(AccordionItemContext)
  
  if (!context || !parent) return null

  const isOpen = context.openItems.has(parent.value)

  return (
    <button
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left w-full",
        className
      )}
      onClick={() => context.toggleItem(parent.value)}
      aria-expanded={isOpen}
    >
      {children}
      <ChevronDown 
        className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} 
      />
    </button>
  )
}

interface AccordionContentProps {
  className?: string
  children: React.ReactNode
}

function AccordionContent({ className, children }: AccordionContentProps) {
  const context = React.useContext(AccordionContext)
  const parent = React.useContext(AccordionItemContext)
  
  if (!context || !parent) return null

  const isOpen = context.openItems.has(parent.value)

  return (
    <div 
      className={cn(
        "overflow-hidden text-sm transition-all duration-200",
        isOpen ? "animate-accordion-down" : "animate-accordion-up hidden"
      )}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </div>
  )
}

const AccordionItemContext = React.createContext<{ value: string } | null>(null)

// Wrap AccordionItem to provide context
const WrappedAccordionItem = ({ value, className, children }: AccordionItemProps) => (
  <AccordionItemContext.Provider value={{ value }}>
    <AccordionItem value={value} className={className}>
      {children}
    </AccordionItem>
  </AccordionItemContext.Provider>
)

export { 
  Accordion, 
  WrappedAccordionItem as AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
}
