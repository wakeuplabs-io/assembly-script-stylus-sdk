#!/usr/bin/env node

import { DeploymentMetrics, IncrementMetrics } from "../test/CounterPerformance.js";
import { deploy } from "./utils/deploy.js";
import { increment } from "./utils/increment.js";
import { saveResults } from "../../shared/save-results.js";

interface PerformanceResult {
  deployment?: DeploymentMetrics;
  increment?: IncrementMetrics;
  contractAddress: string;
  timestamp: string;
}

async function runPerformanceTests(): Promise<PerformanceResult> {
  console.log("🎯 Running full performance test suite...");

  const deploymentMetrics = await deploy();
  const incrementMetrics = await increment();

  const result: PerformanceResult = {
    deployment: deploymentMetrics,
    increment: incrementMetrics,
    contractAddress: incrementMetrics.transactionHash,
    timestamp: new Date().toISOString(),
  };

  console.log("🎉 Full performance test suite completed!");
  return result;
}

async function main(): Promise<void> {
  try {
    const results = await runPerformanceTests();
    saveResults("performance-solidity", results);
  } catch (error) {
    console.error("❌ Performance test failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as runJsonPerformanceTest };
