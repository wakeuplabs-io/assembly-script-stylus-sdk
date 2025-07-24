export interface OnboardingStep {
  step: string
  description: string
  command: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    step: "Step 1: Generate project",
    description: "Create a new Stylus contract template",
    command: "npx as-stylus generate my-token",
  },
  {
    step: "Step 2: Copy contract code", 
    description: "Replace contract.ts with the code shown here",
    command: "",
  },
  {
    step: "Step 3: Build & compile",
    description: "Transform TypeScript into WebAssembly", 
    command: "cd my-token && npx as-stylus build contract.ts",
  },
  {
    step: "Step 4: Deploy to Arbitrum",
    description: "Deploy your contract to Arbitrum Sepolia testnet",
    command: " npx as-stylus run deploy --private-key <YOUR_PRIVATE_KEY> --rpc-url <YOUR_RPC_URL>",
  },
]