#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { buildCommand } from "./commands/build/build.js";
import { cleanCommand } from "./commands/clean/clean.js";
import { compileCommand } from "./commands/compile/compile.js";
import { deployCommand } from "./commands/deploy/deploy.js";
import { generateCommand } from "./commands/generate/generate.js";
import { lintCommand } from "./commands/lint/lint.js";
import { handleGlobalError } from "./utils/global-error-handler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main CLI entry point with unified error handling
 */
async function main() {
  try {
    const packageJson = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf-8"));

    const program = new Command();

    program
      .name("as-stylus")
      .description("SDK to build AssemblyScript contracts for Stylus")
      .version(packageJson.version);

    program.addCommand(generateCommand);
    program.addCommand(buildCommand);
    program.addCommand(cleanCommand);
    program.addCommand(lintCommand);
    program.addCommand(compileCommand);
    program.addCommand(deployCommand);

    // Parse command line arguments
    await program.parseAsync();
  } catch (error) {
    // Global error handler catches all unhandled errors
    handleGlobalError(error);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  handleGlobalError(reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  handleGlobalError(error);
});

// Start the CLI
main().catch(handleGlobalError);

export * from "./sdk-interface/index.js";
export * from "./tests/index.js";
