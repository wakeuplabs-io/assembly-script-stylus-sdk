import { config } from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRoot = path.resolve(__dirname, "../..");

// Add zod validation
const RPC_URL = z.string().url().nonempty();
const PRIVATE_KEY = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/)
  .nonempty();
const ROOT = z.string().nonempty().default(defaultRoot);
const DEPLOY_TIMEOUT = z.number().default(120_000);

const schema = z.object({
  RPC_URL: RPC_URL,
  PRIVATE_KEY: PRIVATE_KEY,
  DEPLOY_TIMEOUT: DEPLOY_TIMEOUT,
  ROOT: ROOT,
});

const env = schema.parse(process.env);

export default env;
