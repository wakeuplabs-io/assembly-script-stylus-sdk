export interface DeploymentMetrics {
  deploymentTime: number;
  gasUsed?: string;
  address?: string;
  transactionHash?: string;
  size?: string;
}

export interface IncrementMetrics {
  gasUsed: string;
  executionTime: number;
  transactionHash: string;
}

export interface PerformanceResult {
  deployment?: DeploymentMetrics;
  increment?: IncrementMetrics;
  contractAddress: string;
  timestamp: string;
}
