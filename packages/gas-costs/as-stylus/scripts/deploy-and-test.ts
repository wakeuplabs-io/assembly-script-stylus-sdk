#!/usr/bin/env node

import { deploy } from "./methods/deploy.js";
import { increment } from "./methods/increment.js";

import { PerformanceResult } from "../../shared/types/performance.js";
import { saveResults } from "./utils/save-results.js";
import { mint } from "./methods/mint.js";

async function runCounterPerformanceTests(): Promise<PerformanceResult> {
  console.log("🎯 Running full performance test suite...");

  const deploymentMetrics = await deploy("COUNTER");
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

async function runErc20PerformanceTests(): Promise<PerformanceResult> {
  console.log("🎯 Running ERC20 performance test suite...");

  const deploymentMetrics = await deploy("ERC20");
  const contractAddress = deploymentMetrics.address as `0x${string}`;
  const mintMetrics = await mint(contractAddress);

  const result: PerformanceResult = {
    deployment: deploymentMetrics,
    mint: mintMetrics,
    contractAddress,
    timestamp: new Date().toISOString(),
  };

  console.log("🎉 ERC20 performance test suite completed!");
  return result;
}

async function main(): Promise<void> {
  try {
    const results = await runErc20PerformanceTests();
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
