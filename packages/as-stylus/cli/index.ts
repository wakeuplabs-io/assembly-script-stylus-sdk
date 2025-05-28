import { Command } from "commander";
import { generateCommand } from "./commands/generate/generate.js";
import { buildCommand } from "./commands/build/build.js";
import { lintCommand } from "./commands/lint/lint.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

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

program.parse();
