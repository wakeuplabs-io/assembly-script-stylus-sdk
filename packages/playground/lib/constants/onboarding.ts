export interface OnboardingStep {
  step: string
  description: string
  command: string
  hint?: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    step: "Step 1: Generate project",
    description: "Create a new Stylus contract template",
    command: "npx @wakeuplabs/as-stylus generate my-token",
  },
  {
    step: "Step 2: Open project and copy contract code", 
    description: "Navigate to project folder, open it in your editor, then replace contract.ts with the code shown here",
    command: "cd my-token && code .",
  },
  {
    step: "Step 3: Build & compile",
    description: "Transform TypeScript into WebAssembly", 
    command: "npx @wakeuplabs/as-stylus compile contract.ts",
  },
  {
    step: "Step 4: Deploy to Arbitrum",
    description: "Deploy your contract to Arbitrum Sepolia testnet. Replace <YOUR_PRIVATE_KEY> with your wallet's private key (must start with 0x) and use the recommended RPC endpoint below.",
    command: "npx @wakeuplabs/as-stylus deploy --private-key 0xYOUR_PRIVATE_KEY_HERE --endpoint https://sepolia-rollup.arbitrum.io/rpc contract.ts --constructor-args \"MyToken\" \"MYT\"",
    hint: "Arbitrum Sepolia RPC: https://sepolia-rollup.arbitrum.io/rpc",
  },
]