"use client"

import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useClipboard } from "@/hooks/use-clipboard"

interface CodeBlockProps {
  code: string
  showCopy?: boolean
  height?: string
}

export function CodeBlock({ code, showCopy = false, height = "400px" }: CodeBlockProps) {
  const { copy, copied } = useClipboard()

  return (
    <div className="relative">
      <div className="border border-gray-700 rounded-lg overflow-hidden bg-[#0D1117]">
        <pre
          className="p-4 font-mono text-sm leading-relaxed overflow-auto text-gray-300 code-block-pre"
          style={{ height }}
        >
          <code className="text-gray-300">{code}</code>
        </pre>
      </div>

      {showCopy && (
        <Button
          onClick={() => copy(code)}
          size="sm"
          variant="outline"
          className="absolute top-3 right-3 bg-gray-800/90 border-gray-600 hover:bg-gray-700/90 backdrop-blur-sm z-10 transition-all duration-200"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-green-400 text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      )}
    </div>
  )
}
