// ---------------------------------------------------------------
//  Contract Helpers — contract deployment and interaction utilities
// ---------------------------------------------------------------
import { toFunctionSelector } from "viem";

import {
  run,
  stripAnsi,
  ROOT,
  RPC_URL,
  PRIVATE_KEY,
  USER_B_PRIVATE_KEY,
} from "./system-helpers.js";

export function getFunctionSelector(signature: string) {
  return toFunctionSelector(signature);
}

export function createContractHelpers(contractAddr: string) {
  const USER_B = stripAnsi(
    run(`cast wallet address --private-key ${USER_B_PRIVATE_KEY}`),
  ).toLowerCase();

  return {
    sendData: (data: string, gasLimit?: string) => {
      const gasFlag = gasLimit ? ` --gas-limit ${gasLimit}` : "";
      const raw = run(
        `cast send ${contractAddr} ${data.slice(2)} --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL}${gasFlag} --json`,
      );
      const json = JSON.parse(raw);
      return json;
    },
    sendDataFrom: (address: string, data: string) => {
      const key =
        address.toLowerCase() === USER_B.toLowerCase()
          ? process.env.USER_B_PRIVATE_KEY
          : PRIVATE_KEY;

      const cmd = `cast send ${contractAddr} ${data.slice(2)} \
    --private-key ${key} --rpc-url ${RPC_URL} --json`;

      const raw = run(cmd, ROOT, true);
      let receipt = null;
      try {
        receipt = JSON.parse(raw);
      } catch (_) {
        // ignore: raw no es JSON, es un mensaje de error
      }

      const reverted = !receipt || receipt.status === "0x0" || /execution reverted/i.test(raw);

      return { reverted, receipt, raw };
    },

    callData: (data: string) =>
      stripAnsi(run(`cast call ${contractAddr} ${data} --rpc-url ${RPC_URL}`)).trim(),
  };
}
