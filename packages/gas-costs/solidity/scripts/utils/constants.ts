import env from "./env.js";

import { readFileSync } from "fs";
import { join } from "path";

const Counter = JSON.parse(
  readFileSync(join(env.ROOT, "/artifacts/contracts/Counter.sol/Counter.json"), "utf-8"),
);

export const CONTRACT_PATHS = {
  COUNTER: {
    bytecode: Counter.bytecode,
    abi: Counter.abi,
    bytecodeSize: (Counter.bytecode.length - 2) / 2,
  },
};
