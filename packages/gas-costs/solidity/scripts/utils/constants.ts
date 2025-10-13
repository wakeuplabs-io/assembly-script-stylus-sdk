import env from "./env.js";

import { readFileSync } from "fs";
import { join } from "path";

const Counter = JSON.parse(
  readFileSync(join(env.ROOT, "/artifacts/contracts/Counter.sol/Counter.json"), "utf-8"),
);
const ERC20 = JSON.parse(
  readFileSync(join(env.ROOT, "/artifacts/contracts/erc20.sol/ERC20.json"), "utf-8"),
);

export const CONTRACT_PATHS = {
  COUNTER: {
    bytecode: Counter.bytecode,
    abi: Counter.abi,
    bytecodeSize: (Counter.bytecode.length - 2) / 2,
    args: [],
  },
  ERC20: {
    bytecode: ERC20.bytecode,
    abi: ERC20.abi,
    bytecodeSize: (ERC20.bytecode.length - 2) / 2,
    args: ["Test", "TEST"],
  },
};
