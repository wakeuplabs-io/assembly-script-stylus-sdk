"use client"

import { useState } from "react"
import { Copy, Check, Terminal, Info } from "lucide-react"

type Cmd = {
  cmd: string
  desc?: string
}

const RUST_SETUP: Cmd[] = [
  { cmd: "rustup update", desc: "Update rustup and installed toolchains." },
  { cmd: "rustup default stable", desc: "Use stable toolchain by default." },
  { cmd: "rustc --version", desc: "Verify version (cargo-stylus requires Rust ≥ 1.81)." },
  { cmd: "rustup target add wasm32-unknown-unknown", desc: "Add WASM target (mandatory for Stylus)." },
]

const STYLUS_INSTALL: Cmd[] = [
  { cmd: "cargo install cargo-stylus", desc: "Install the Stylus CLI (latest version published on crates.io)." },
]

function useCopyFeedback() {
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(prev => ({ ...prev, [key]: true }))
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 1800)
  }
  return { copied, copy }
}

function CommandRow({ id, cmd, desc, onCopy, copied }: {
  id: string
  cmd: string
  desc?: string
  onCopy: (text: string, key: string) => void
  copied: boolean
}) {
  return (
    <div className="rounded-lg border border-gray-700 p-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <code className="text-white font-mono text-sm break-all">
          {cmd}
        </code>
        <button
          onClick={() => onCopy(cmd, id)}
          className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded hover:bg-gray-700 transition self-start"
          aria-label={`Copy ${cmd}`}
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          <span className={`text-xs ${copied ? "text-green-400" : ""}`}>
            {copied ? "Copied!" : "Copy"}
          </span>
        </button>
      </div>
      {desc && <p className="text-gray-400 text-xs mt-2 leading-relaxed">{desc}</p>}
    </div>
  )
}

export function Prerequisites() {
  const { copied, copy } = useCopyFeedback()

  const rustScript = RUST_SETUP.map(c => c.cmd).join("\n")
  const installScript = STYLUS_INSTALL.map(c => c.cmd).join("\n")

  return (
    <div className="mb-8">
      <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-5 h-5 text-gray-300" />
          <h3 className="text-lg sm:text-xl font-semibold text-white">Prerequisites</h3>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Make sure you have the required tools installed before getting started.
        </p>

        <section className="bg-gray-800 border border-gray-700 rounded-xl p-3 sm:p-4 mb-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h4 className="text-white font-medium text-sm">Rust Setup (in order)</h4>
            <button
              onClick={() => copy(rustScript, "all-rust")}
              className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700 transition"
              aria-label="Copy all Rust setup commands"
            >
              {copied["all-rust"] ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span className={`text-xs ${copied["all-rust"] ? "text-green-400" : ""}`}>
                {copied["all-rust"] ? "Copied!" : "Copy all"}
              </span>
            </button>
          </div>

          <p className="text-gray-400 text-xs mb-3 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>cargo-stylus requires <strong>Rust 1.81+</strong> and the <code>wasm32-unknown-unknown</code> target.</span>
          </p>

          <div className="space-y-2">
            {RUST_SETUP.map((c, i) => (
              <CommandRow
                key={`rust-${i}`}
                id={`rust-${i}`}
                cmd={c.cmd}
                desc={c.desc}
                onCopy={copy}
                copied={!!copied[`rust-${i}`]}
              />
            ))}
          </div>
        </section>

        <section className="bg-gray-800 border border-gray-700 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h4 className="text-white font-medium text-sm">Install cargo-stylus</h4>
            <button
              onClick={() => copy(installScript, "all-stylus")}
              className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700 transition"
              aria-label="Copy all cargo-stylus commands"
            >
              {copied["all-stylus"] ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span className={`text-xs ${copied["all-stylus"] ? "text-green-400" : ""}`}>
                {copied["all-stylus"] ? "Copied!" : "Copy all"}
              </span>
            </button>
          </div>

          <div className="space-y-2">
            {STYLUS_INSTALL.map((c, i) => (
              <CommandRow
                key={`stylus-${i}`}
                id={`stylus-${i}`}
                cmd={c.cmd}
                desc={c.desc}
                onCopy={copy}
                copied={!!copied[`stylus-${i}`]}
              />
            ))}
          </div>
        </section>

        <div className="sr-only" aria-live="polite">
          {Object.values(copied).some(Boolean) ? "Copied to clipboard" : ""}
        </div>
      </div>
    </div>
  )
}