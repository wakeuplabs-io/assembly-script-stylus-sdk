#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { buildCommand } from "./commands/build/build.js";
import { compileCommand } from "./commands/compile/compile.js";
import { deployCommand } from "./commands/deploy/deploy.js";
import { generateCommand } from "./commands/generate/generate.js";
import { lintCommand } from "./commands/lint/lint.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf-8"));

const program = new Command();

program
  .name("as-stylus")
  .description("SDK to build AssemblyScript contracts for Stylus")
  .version(packageJson.version);

program.addCommand(generateCommand);
program.addCommand(buildCommand);
program.addCommand(lintCommand);
program.addCommand(compileCommand);
program.addCommand(deployCommand);

program.parse();

export * from "./sdk-interface/index.js";
