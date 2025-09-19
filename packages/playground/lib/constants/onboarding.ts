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
    description: "Deploy your contract to Arbitrum Sepolia testnet. You can provide your private key via --private-key parameter or the system will securely prompt for it.",
    command: "npx @wakeuplabs/as-stylus deploy contract.ts --endpoint https://sepolia-rollup.arbitrum.io/rpc --constructor-args \"MyToken\" \"MYT\" --private-key YOUR_PRIVATE_KEY",
    hint: "Alternative: Remove --private-key to be prompted securely (recommended for production)",
  },
]