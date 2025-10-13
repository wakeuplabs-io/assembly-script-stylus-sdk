import { join } from "path";
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { PerformanceResult } from "../../../shared/types/performance.js";

export function saveResults(name: string, results: PerformanceResult): void {
  const resultsDir = join(process.cwd(), "performance-results");
  const filepath = join(resultsDir, `${name}-${results.timestamp.replace(/[:.]/g, "-")}.json`);

  try {
    // Create results directory if it doesn't exist
    execSync(`mkdir -p "${resultsDir}"`, { stdio: "ignore" });

    // Create enhanced JSON with additional metadata
    const enhancedResults = {
      ...results,
      metadata: {
        generatedAt: new Date().toISOString(),
        testFramework: "Hardhat + Viem",
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      },
    };

    // Save enhanced results to JSON file
    writeFileSync(filepath, JSON.stringify(enhancedResults, null, 2));

    console.log(`\n💾 Complete results saved to: ${filepath}`);
  } catch (error) {
    console.error("❌ Error saving results:", error);
  }
}
