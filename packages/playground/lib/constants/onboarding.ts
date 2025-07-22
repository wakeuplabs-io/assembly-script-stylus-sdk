export interface OnboardingStep {
  step: string
  description: string
  command: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    step: "Step 1: Generate a project",
    description: "Create a new contract template",
    command: "npx as-sdk generate my-contract",
  },
  {
    step: "Step 2: Copy the contract",
    description: "Copy the contract in contract.ts",
    command: "",
  },
  {
    step: "Step 3: Build it",
    description: "Compile TypeScript to WASM",
    command: "cd my-contract && npx as-sdk build",
  },
  {
    step: "Step 5: Deploy it",
    description: "Deploy to Arbitrum network",
    command: "npx as-sdk deploy --private-key <YOUR_PRIVATE_KEY>",
  },
] 