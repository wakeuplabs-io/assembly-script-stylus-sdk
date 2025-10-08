#!/usr/bin/env node

import { deploy } from "./utils/deploy.js";
import { increment } from "./utils/increment.js";

import { PerformanceResult } from "../../shared/types/performance.js";
import { saveResults } from "./utils/save-results.js";

async function runPerformanceTests(): Promise<PerformanceResult> {
  console.log("🎯 Running full performance test suite...");

  const deploymentMetrics = await deploy();
  const contractAddress = deploymentMetrics.address as `0x${string}`;
  const incrementMetrics = await increment(contractAddress);

  const result: PerformanceResult = {
    deployment: deploymentMetrics,
    increment: incrementMetrics,
    contractAddress,
    timestamp: new Date().toISOString(),
  };

  console.log("🎉 Full performance test suite completed!");
  return result;
}

async function main(): Promise<void> {
  try {
    const results = await runPerformanceTests();
    saveResults("performance-as-stylus", results);
  } catch (error) {
    console.error("❌ Performance test failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as runJsonPerformanceTest };
