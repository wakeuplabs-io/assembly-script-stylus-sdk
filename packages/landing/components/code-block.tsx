"use client"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useClipboard } from "@/hooks/use-clipboard"

interface CodeBlockProps {
  code: string
  language: string
  showCopy?: boolean
}

export function CodeBlock({ code, language, showCopy = false }: CodeBlockProps) {
  const { copy, copied } = useClipboard()

  return (
    <div className="relative">
      <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
        <code className={`language-${language} text-gray-300 font-mono text-sm`}>{code}</code>
      </pre>

      {showCopy && (
        <Button
          onClick={() => copy(code)}
          size="sm"
          variant="outline"
          className="absolute top-2 right-2 bg-gray-800 border-gray-600 hover:bg-gray-700"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </Button>
      )}
    </div>
  )
}
