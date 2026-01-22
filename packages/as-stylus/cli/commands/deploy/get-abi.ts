import path from "path";

import { ABI_PATH, BUILD_PATH } from "@/cli/utils/constants.js";
import { readFile } from "@/cli/utils/fs.js";

export function getAbi(contractPath: string) {
  const cwd = process.cwd();
  // Extract just the filename from the contract path (e.g., "src/contracts/voting.ts" -> "voting.ts")
  const contractFileName = path.basename(contractPath);
  // Replace .ts extension with -abi.json (e.g., "voting.ts" -> "voting-abi.json")
  const abiFileName = contractFileName.replace(".ts", "-abi.json");
  const abiPath = path.resolve(cwd, BUILD_PATH, ABI_PATH, abiFileName);
  const abi = JSON.parse(readFile(abiPath));
  return abi;
}
