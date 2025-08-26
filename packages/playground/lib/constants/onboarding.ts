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
    description: "Deploy your contract to Arbitrum Sepolia testnet. The system will securely prompt for your wallet's private key (no need to expose it in the command).",
    command: "npx @wakeuplabs/as-stylus deploy contract.ts --endpoint https://sepolia-rollup.arbitrum.io/rpc --constructor-args \"MyToken\" \"MYT\"",
    hint: "Your private key will be requested securely during deployment (similar to sudo password prompt)",
  },
]