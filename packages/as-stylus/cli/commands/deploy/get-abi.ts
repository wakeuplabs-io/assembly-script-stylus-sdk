import path from "path";

import { ABI_PATH, BUILD_PATH } from "@/cli/utils/constants.js";
import { readFile } from "@/cli/utils/fs.js";

export function getAbi(contractPath: string) {
  const cwd = process.cwd();
  const abiPath = path.resolve(cwd, BUILD_PATH, ABI_PATH, contractPath.replace(".ts", "-abi.json"));
  const abi = JSON.parse(readFile(abiPath));
  return abi;
}
