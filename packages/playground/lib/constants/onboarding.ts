export interface OnboardingStep {
  step: string
  description: string
  command: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    step: "Step 1: Generate project",
    description: "Create a new Stylus contract template",
    command: "npx as-sdk generate my-token",
  },
  {
    step: "Step 2: Copy contract code", 
    description: "Replace contract.ts with the code shown here",
    command: "# Copy the contract code from the editor →",
  },
  {
    step: "Step 3: Build & compile",
    description: "Transform TypeScript into WebAssembly", 
    command: "cd my-token && npm run build",
  },
  {
    step: "Step 4: Deploy to Arbitrum",
    description: "Deploy your contract to Arbitrum Sepolia testnet",
    command: "npm run deploy --private-key <YOUR_PRIVATE_KEY>",
  },
]