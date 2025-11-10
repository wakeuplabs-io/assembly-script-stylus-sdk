import { config } from "dotenv";
import path from "path";
import { Hex } from "viem";

config();

export const ROOT = path.resolve(__dirname, "../../..");
export const RPC_URL = process.env.RPC_URL ?? "http://localhost:8547";
export const PRIVATE_KEY = process.env.PRIVATE_KEY! as Hex;
export const USER_B_PRIVATE_KEY = process.env.USER_B_PRIVATE_KEY! as Hex;

export const DEPLOY_TIMEOUT = 120_000;
export const PROJECT_ROOT = path.join(ROOT, "/as-stylus/");

export const ROOT_PATH = path.join(ROOT, "/as-stylus/__tests__/contracts");

export const CONTRACT_PATHS = {
  ACCESS_CONTROL: {
    contract: path.join(ROOT_PATH, "/management"),
    abi: path.join(ROOT_PATH, "/management/artifacts/abi/accessControl-abi.json"),
  },
  IF_HAPPY_PATH: {
    contract: path.join(ROOT_PATH, "/if-happy-path"),
    abi: path.join(ROOT_PATH, "/if-happy-path/artifacts/abi/contract-abi.json"),
  },
  ADMIN_REGISTRY: {
    contract: path.join(ROOT_PATH, "/admin-registry"),
    abi: path.join(ROOT_PATH, "/admin-registry/artifacts/abi/admin-abi.json"),
  },
  BALANCES: {
    contract: path.join(ROOT_PATH, "/balances"),
    abi: path.join(ROOT_PATH, "/balances/artifacts/abi/contract-abi.json"),
  },
  COUNTER: {
    contract: path.join(ROOT_PATH, "/counter"),
    abi: path.join(ROOT_PATH, "/counter/artifacts/abi/contract-abi.json"),
  },
  STORAGE: {
    contract: path.join(ROOT_PATH, "/storage"),
    abi: path.join(ROOT_PATH, "/storage/artifacts/abi/contract-abi.json"),
  },
  STRING: {
    contract: path.join(ROOT_PATH, "/string"),
    abi: path.join(ROOT_PATH, "/string/artifacts/abi/contract-abi.json"),
  },
  ERC20: {
    contract: path.join(ROOT_PATH, "/erc20"),
    abi: path.join(ROOT_PATH, "/erc20/artifacts/abi/contract-abi.json"),
  },
  ERC20_FULL: {
    contract: path.join(ROOT_PATH, "/erc20-full"),
    abi: path.join(ROOT_PATH, "/erc20-full/artifacts/abi/contract-abi.json"),
  },
  STRUCT: {
    contract: path.join(ROOT_PATH, "/struct"),
    abi: path.join(ROOT_PATH, "/struct/artifacts/abi/contract-abi.json"),
  },
  CUSTOM_ERRORS: {
    contract: path.join(ROOT_PATH, "/custom-errors"),
    abi: path.join(ROOT_PATH, "/custom-errors/artifacts/abi/contract-abi.json"),
  },
  ERC721: {
    contract: path.join(ROOT_PATH, "/erc721"),
    abi: path.join(ROOT_PATH, "/erc721/artifacts/abi/contract-abi.json"),
  },
  INHERITANCE: {
    contract: path.join(ROOT_PATH, "/inheritance"),
    abi: path.join(ROOT_PATH, "/inheritance/artifacts/abi/child-abi.json"),
  },
  ERC20_OVERRIDE: {
    contract: path.join(ROOT_PATH, "/erc20-override"),
    abi: path.join(ROOT_PATH, "/erc20-override/artifacts/abi/token-abi.json"),
  },
  ADVANCED_COUNTER: {
    contract: path.join(ROOT_PATH, "/advanced-counter"),
    abi: path.join(ROOT_PATH, "/advanced-counter/artifacts/abi/contract-abi.json"),
  },
  NESTED_FUNCTIONS: {
    contract: path.join(ROOT_PATH, "/nested-functions"),
    abi: path.join(ROOT_PATH, "/nested-functions/artifacts/abi/contract-abi.json"),
  },
  FUNCTION_CALLED_IN_ARGS: {
    contract: path.join(ROOT_PATH, "/functions-called-in-args"),
    abi: path.join(ROOT_PATH, "/functions-called-in-args/artifacts/abi/contract-abi.json"),
  },
  EXPERT_COUNTER: {
    contract: path.join(ROOT_PATH, "/expert-counter"),
    abi: path.join(ROOT_PATH, "/expert-counter/artifacts/abi/contract-abi.json"),
  },
  CALLS: {
    contract: path.join(ROOT_PATH, "/calls"),
    abi: path.join(ROOT_PATH, "/calls/artifacts/abi/contract-abi.json"),
  },
  STATIC_CALLS: {
    contract: path.join(ROOT_PATH, "/static-calls"),
    abi: path.join(ROOT_PATH, "/static-calls/artifacts/abi/contract-abi.json"),
  },
  WHILE: {
    contract: path.join(ROOT_PATH, "/while"),
    abi: path.join(ROOT_PATH, "/while/artifacts/abi/contract-abi.json"),
  },
  NEW_STRUCT: {
    contract: path.join(ROOT_PATH, "/new-struct"),
    abi: path.join(ROOT_PATH, "/new-struct/artifacts/abi/contract-abi.json"),
  },
  FALLBACK_RECEIVE: {
    contract: path.join(ROOT_PATH, "/fallback-receive"),
    abi: path.join(ROOT_PATH, "/fallback-receive/artifacts/abi/contract-abi.json"),
  },
  FALLBACK_ONLY: {
    contract: path.join(ROOT_PATH, "/fallback-receive"),
    abi: path.join(ROOT_PATH, "/fallback-receive/artifacts/abi/fallback_only-abi.json"),
  },
  RECEIVE_ONLY: {
    contract: path.join(ROOT_PATH, "/fallback-receive"),
    abi: path.join(ROOT_PATH, "/fallback-receive/artifacts/abi/receive_only-abi.json"),
  },
  RECEIVE_FALLBACK_REVERSE: {
    contract: path.join(ROOT_PATH, "/fallback-receive"),
    abi: path.join(ROOT_PATH, "/fallback-receive/artifacts/abi/receive_fallback_reverse-abi.json"),
  },
  NO_FALLBACK_NO_RECEIVE: {
    contract: path.join(ROOT_PATH, "/fallback-receive"),
    abi: path.join(ROOT_PATH, "/fallback-receive/artifacts/abi/no_fallback_no_receive-abi.json"),
  },
  ARRAYS: {
    contract: path.join(ROOT_PATH, "/arrays"),
    abi: path.join(ROOT_PATH, "/arrays/artifacts/abi/contract-abi.json"),
  },
  MAPPING_ADDRESS: {
    contract: path.join(ROOT_PATH, "/mapping"),
    abi: path.join(ROOT_PATH, "/mapping/artifacts/abi/address-abi.json"),
  },
  MAPPING_UINT256: {
    contract: path.join(ROOT_PATH, "/mapping"),
    abi: path.join(ROOT_PATH, "/mapping/artifacts/abi/uint256-abi.json"),
  },
  MAPPING_INT256: {
    contract: path.join(ROOT_PATH, "/mapping"),
    abi: path.join(ROOT_PATH, "/mapping/artifacts/abi/int256-abi.json"),
  },
  PAUSABLE: {
    contract: path.join(ROOT_PATH, "/management"),
    abi: path.join(ROOT_PATH, "/management/artifacts/abi/pausable-abi.json"),
  },
  OWNABLE: {
    contract: path.join(ROOT_PATH, "/management"),
    abi: path.join(ROOT_PATH, "/management/artifacts/abi/ownable-abi.json"),
  },
  REENTRANCY: {
    contract: path.join(ROOT_PATH, "/management"),
    abi: path.join(ROOT_PATH, "/management/artifacts/abi/reentrancyGuard-abi.json"),
  },
} as const;
