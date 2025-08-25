export interface FlowStep {
  title: string
  desc: string
}

export const FLOW_STEPS: FlowStep[] = [
  { title: "TypeScript", desc: "Write contracts" },
  { title: "Generate", desc: "AssemblyScript" },
  { title: "Compile", desc: "WASM" },
  { title: "Deploy", desc: "To Arbitrum" },
  { title: "Interact", desc: "Call functions" }, // TODO: add a call to the contract
]

export const FLOW_DIAGRAM_TITLE = "From TypeScript to Stylus in seconds"

export const UNDER_THE_HOOD_TITLE = "Curious what gets compiled?"
export const UNDER_THE_HOOD_SUBTITLE = "Peek under the hood to see the generated artifacts"

export const ACCORDION_ITEMS = {
  ENTRYPOINT: {
    title: "Generated entrypoint",
    description: "The main entry point that routes function calls based on selectors",
  },
  CONTRACT_TRANSFORMED: {
    title: "Contract transformed",
    description: "The contract transformed to AssemblyScript",
  },
  ABI: {
    title: "ABI",
    description: "Application Binary Interface for contract interaction",
  },
  WASM: {
    title: "WASM",
    description: "WebAssembly bytecode optimized for Stylus execution",
  },
} as const 