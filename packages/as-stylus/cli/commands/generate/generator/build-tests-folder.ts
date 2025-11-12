import fs from "fs";
import path from "path";

import { getTestFileTemplate } from "@/templates/test.js";

export function buildTestsFolder(targetPath: string) {
  fs.mkdirSync(path.join(targetPath, "src/tests/counter"), { recursive: true });
  fs.writeFileSync(
    path.join(targetPath, "src/tests/config.ts"),
    `
import { config as loadConfig } from "dotenv";
import { Hex } from "viem";
import path from "path";

loadConfig();

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
const DEPLOY_TIMEOUT = Number(process.env.DEPLOY_TIMEOUT) as number;
const RPC_URL = process.env.RPC_URL as string;
const DEFAULT_ROOT = path.resolve(__dirname, "../..") as string;

export const config = {
  privateKey: PRIVATE_KEY,
  deployTimeout: DEPLOY_TIMEOUT,
  rpcUrl: RPC_URL,
  projectRoot: DEFAULT_ROOT,
};
    `,
  );
  fs.writeFileSync(
    path.join(targetPath, "src/tests/counter/counter.test.ts"),
    getTestFileTemplate(),
  );
}
