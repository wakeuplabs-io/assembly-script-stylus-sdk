import * as path from "path";
import env from "./env.js";

export const CONTRACT_PATHS = {
  COUNTER: {
    contract: path.join(env.ROOT, ""),
    abi: path.join(env.ROOT, "/artifacts/abi/contract-abi.json"),
  },
};
