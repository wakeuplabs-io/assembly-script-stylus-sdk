import { config } from "dotenv";
import path from "path";

config();

export const ROOT = path.resolve(__dirname, "../../..");
export const RPC_URL = process.env.RPC_URL ?? "http://localhost:8547";
export const PRIVATE_KEY = process.env.PRIVATE_KEY!;
export const USER_B_PRIVATE_KEY = process.env.USER_B_PRIVATE_KEY!;

export const DEPLOY_TIMEOUT = 120_000;
export const CONTRACT_ADDRESS_REGEX = /deployed code at address:\s*(0x[0-9a-fA-F]{40})/i;
export const PROJECT_ROOT = path.join(ROOT, "/as-stylus/");

export const ROOT_PATH = path.join(ROOT, "/as-stylus/__tests__/contracts");

export const CONTRACT_PATHS = {
  IF_HAPPY_PATH: {
    contract: path.join(ROOT_PATH, "/if-happy-path"),
    abi: path.join(ROOT_PATH, "/if-happy-path/artifacts/abi/IfHappyPath-abi.json"),
  },
  ADMIN_REGISTRY: {
    contract: path.join(ROOT_PATH, "/admin-registry"),
    abi: path.join(ROOT_PATH, "/admin-registry/artifacts/abi/AdminRegistry-abi.json"),
  },
  BALANCES: {
    contract: path.join(ROOT_PATH, "/balances"),
    abi: path.join(ROOT_PATH, "/balances/artifacts/abi/Token-abi.json"),
  },
  COUNTER: {
    contract: path.join(ROOT_PATH, "/counter"),
    abi: path.join(ROOT_PATH, "/counter/artifacts/abi/Counter-abi.json"),
  },
  STORAGE: {
    contract: path.join(ROOT_PATH, "/storage"),
    abi: path.join(ROOT_PATH, "/storage/artifacts/abi/Storage-abi.json"),
  },
  STRING: {
    contract: path.join(ROOT_PATH, "/string"),
    abi: path.join(ROOT_PATH, "/string/artifacts/abi/StringStorage-abi.json"),
  },
  ERC20: {
    contract: path.join(ROOT_PATH, "/erc20"),
    abi: path.join(ROOT_PATH, "/erc20/artifacts/abi/ERC20-abi.json"),
  },
  ERC20_FULL: {
    contract: path.join(ROOT_PATH, "/erc20-full"),
    abi: path.join(ROOT_PATH, "/erc20-full/artifacts/abi/ERC20Full-abi.json"),
  },
  STRUCT: {
    contract: path.join(ROOT_PATH, "/struct"),
    abi: path.join(ROOT_PATH, "/struct/artifacts/abi/StructContract-abi.json"),
  },
  CUSTOM_ERRORS: {
    contract: path.join(ROOT_PATH, "/custom-errors"),
    abi: path.join(ROOT_PATH, "/custom-errors/artifacts/abi/RevertContract721-abi.json"),
  },
} as const;
