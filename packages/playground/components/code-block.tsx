"use client"

import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useClipboard } from "@/hooks/use-clipboard"
import { useEffect, useState } from "react"
import type { editor } from "monaco-editor"

// Importación condicional de Monaco para evitar problemas de SSR
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MonacoEditor: any = null
if (typeof window !== 'undefined') {
  // Solo importar en el lado del cliente
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  MonacoEditor = require('@monaco-editor/react').default
}

interface CodeBlockProps {
  code: string
  showCopy?: boolean
  height?: string
  language?: string
}

export function CodeBlock({ code, showCopy = false, height = "400px", language = "javascript" }: CodeBlockProps) {
  const { copy, copied } = useClipboard()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const beforeMount = (monaco: typeof import("monaco-editor")) => {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })
  }

  return (
    <div className="relative">
      <div className="border border-gray-700 rounded-lg overflow-hidden bg-[#0D1117]">
        {mounted && (
          <MonacoEditor
            value={code}
            language={language}
            theme="vs-dark"
            beforeMount={beforeMount}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              wordWrap: "on",
              lineNumbers: "off",
              padding: { top: 16, bottom: 16 },
              overviewRulerLanes: 0,
              renderLineHighlight: "none",
              renderValidationDecorations: "off",
              scrollbar: { vertical: "auto", horizontal: "auto" },
              hover: { enabled: false },
            } as editor.IStandaloneEditorConstructionOptions}
            height={height}
          />
        )}
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
