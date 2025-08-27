"use client"

import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useClipboard } from "@/hooks/use-clipboard"
import { useEffect, useState } from "react"
import type { editor } from "monaco-editor"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MonacoEditor: any = null
if (typeof window !== 'undefined') {
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
      {showCopy && (
        <div className="bg-gray-800/90 border-b border-gray-700 px-4 py-2 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-gray-300 text-sm font-medium">Contract Code</span>
          </div>
          <Button
            onClick={() => copy(code)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm transition-all duration-200"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                <span className="font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                <span className="font-medium">Copy Contract</span>
              </>
            )}
          </Button>
        </div>
      )}
      
      <div className={`border border-gray-700 ${showCopy ? 'rounded-b-lg border-t-0' : 'rounded-lg'} overflow-hidden bg-[#0D1117]`}>
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
    </div>
  )
}
