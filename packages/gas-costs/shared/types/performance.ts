export interface DeploymentMetrics {
  deploymentTime: number;
  gasUsed?: string;
  address?: string;
  transactionHash?: string;
  size?: string;
  contractName?: string;
}

export interface WriteMetrics {
  gasUsed: string;
  executionTime: number;
  transactionHash: string;
}

export interface PerformanceResult {
  deployment?: DeploymentMetrics;
  increment?: WriteMetrics;
  mint?: WriteMetrics;
  contractAddress?: string;
  timestamp?: string;
}
