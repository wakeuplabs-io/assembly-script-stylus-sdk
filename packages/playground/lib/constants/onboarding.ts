export interface OnboardingStep {
  step: string
  description: string
  command: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    step: "Step 1: Generate contract",
    description: "Create a new contract template",
    command: "npx as-sdk generate my-contract",
  },
  {
    step: "Step 2: Copy / edit the contract",
    description: "",
    command: "",
  },
  {
    step: "Step 3: Build contract",
    description: "Compile TypeScript to WASM",
    command: "cd my-contract && npx as-sdk build",
  },
  {
    step: "Step 4: Import your PRIVATE_KEY",
    description: "",
    command: "",
  },
  {
    step: "Step 5: Deploy contract",
    description: "Deploy to Arbitrum network",
    command: "npx as-sdk deploy",
  },
] 