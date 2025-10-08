#!/usr/bin/env node

import { deploy } from "./methods/deploy.js";
import { increment } from "./methods/increment.js";
import { mint } from "./methods/mint.js";
import { saveResults } from "./utils/save-results.js";
import { PerformanceResult } from "../../shared/types/performance.js";

async function runCounterPerformanceTests(): Promise<PerformanceResult> {
  console.log("🎯 Running full performance test suite...");

  const deploymentMetrics = await deploy("COUNTER");
  const incrementMetrics = await increment(deploymentMetrics.address as `0x${string}`);

  const result: PerformanceResult = {
    deployment: deploymentMetrics,
    increment: incrementMetrics,
    contractAddress: deploymentMetrics.address,
    timestamp: new Date().toISOString(),
  };

  console.log("🎉 Full performance test suite completed!");
  return result;
}

async function runErc20PerformanceTests(): Promise<PerformanceResult> {
  console.log("🎯 Running full performance test suite...");

  const deploymentMetrics = await deploy("ERC20");
  const mintMetrics = await mint(deploymentMetrics.address as `0x${string}`);

  const result: PerformanceResult = {
    deployment: deploymentMetrics,
    mint: mintMetrics,
    contractAddress: deploymentMetrics.address,
    timestamp: new Date().toISOString(),
  };

  console.log("🎉 Full performance test suite completed!");
  return result;
}

async function main(): Promise<void> {
  try {
    const results = await runErc20PerformanceTests();
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
