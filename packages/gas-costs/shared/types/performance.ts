export interface DeploymentMetrics {
  gasUsed: string;
  deploymentTime: number;
  gasPrice: string;
  totalCost: string;
}

export interface IncrementMetrics {
  gasUsed: string;
  executionTime: number;
  gasPrice: string;
  totalCost: string;
  transactionHash: string;
}

export interface PerformanceResult {
  deployment?: DeploymentMetrics;
  increment?: IncrementMetrics;
  contractAddress: string;
  timestamp: string;
}
