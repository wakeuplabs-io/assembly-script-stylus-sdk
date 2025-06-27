import path from "path";

import { ROOT } from "./utils.js";

export const DEPLOY_TIMEOUT = 120_000;
export const CONTRACT_ADDRESS_REGEX = /deployed code at address:\s*(0x[0-9a-fA-F]{40})/i;
export const PROJECT_ROOT = path.join(ROOT, "/as-stylus/");

type ContractPaths = {
  IF_HAPPY_PATH: {
    contract: string;
    abi: string;
  };
  ADMIN_REGISTRY: {
    contract: string;
    abi: string;
  };
};

const ROOT_PATH = path.join(ROOT, "/as-stylus/__tests__/contracts");

export const CONTRACT_PATHS: ContractPaths = {
  IF_HAPPY_PATH: {
    contract: path.join(ROOT_PATH, "/if-happy-path"),
    abi: path.join(ROOT_PATH, "/if-happy-path/artifacts/abi/IfHappyPath-abi.json"),
  },
  ADMIN_REGISTRY: {
    contract: path.join(ROOT_PATH, "/admin-registry"),
    abi: path.join(ROOT_PATH, "/admin-registry/artifacts/abi/AdminRegistry-abi.json"),
  },
};
