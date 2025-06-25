// ---------------------------------------------------------------
//  End-to-end tests — AdminRegistry contract (Stylus)
// ---------------------------------------------------------------
import { config } from "dotenv";
import path from "path";

config();

import {
  ROOT,
  RPC_URL,
  PRIVATE_KEY,
  run,
  stripAnsi,
  calldata,
  createContractHelpers,
  getFunctionSelector,
} from "./utils.js";

const SELECTOR = {
  DEPLOY: getFunctionSelector("deploy(address)"),
  SET: getFunctionSelector("setAdmin(address)"),
  RESET: getFunctionSelector("resetAdmin()"),
  GET: getFunctionSelector("getAdmin()"),
  IS_ADMIN: getFunctionSelector("isAdmin(address)"),
  IS_ZERO: getFunctionSelector("adminIsZero()"),
};

/*───────────────────────────────*
 *  Constants
 *───────────────────────────────*/
const ADMIN = "0x1111111111111111111111111111111111111111";
const ADMIN_FAIL = "0x1111111111111111111111111111111111111112";

/*───────────────────────────────*
 *  Global state across tests
 *───────────────────────────────*/
let contractAddr = "";
let helpers: ReturnType<typeof createContractHelpers>;

/*───────────────────────────────*
 *  Deploy once for the whole file
 *───────────────────────────────*/
beforeAll(() => {
  try {
    const projectRoot = path.join(ROOT, "/as-stylus/");
    const pkg = path.join(ROOT, "/as-stylus/__tests__/contracts/admin-registry");
    run("npm run pre:build", projectRoot);
    run("npx as-stylus build", pkg);
    run("npm run compile", pkg);
    run("npm run check", pkg);

    const dataDeploy = calldata(SELECTOR.DEPLOY, ADMIN);

    const deployLog = stripAnsi(run(`PRIVATE_KEY=${PRIVATE_KEY} npm run deploy`, pkg));
    const m = deployLog.match(/deployed code at address:\s*(0x[0-9a-fA-F]{40})/i);
    if (!m) throw new Error("Could not scrape contract address");
    contractAddr = m[1];
    helpers = createContractHelpers(contractAddr);

    run(
      `cast send ${contractAddr} ${dataDeploy} --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL}`,
    );

    console.log("📍 Deployed at", contractAddr);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to deploy contract:", errorMessage);
    throw error;
  }
}, 120_000);

const send = (data: string) => helpers.sendData(data);
const call = (data: string) => helpers.callData(data);
const expectHex = (data: string, hex: string) =>
  expect(call(data).toLowerCase()).toBe(hex.toLowerCase());

describe("AdminRegistry (Address) — basic ops", () => {
  it("get() after deploy ⇒ initial address", () => {
    const res = call(calldata(SELECTOR.GET));
    console.log("res", res);
    expect(res.toLowerCase()).toContain(ADMIN.toLowerCase());
  });

  it("isAdmin(initial) ⇒ true", () => {
    const result = call(calldata(SELECTOR.IS_ADMIN, ADMIN.toLowerCase()));
    expect(result.toLowerCase()).toBe("0x01");
  });

  it("isAdmin(initial) ⇒ false", () => {
    const result = call(calldata(SELECTOR.IS_ADMIN, ADMIN_FAIL.toLowerCase()));
    expect(result.toLowerCase()).toBe("0x00");
  });

  it("isZero() ⇒ false initially", () => {
    const result = call(calldata(SELECTOR.IS_ZERO));
    expect(result.toLowerCase()).toBe("0x00");
  });

  it("setAdmin(new) ⇒ address updates", () => {
    const NEW_ADMIN = "0x2222222222222222222222222222222222222222";

    send(calldata(SELECTOR.SET, NEW_ADMIN));

    const res = call(calldata(SELECTOR.GET));
    expect(res.toLowerCase()).toContain(NEW_ADMIN.toLowerCase());
  });

  it("resetAdmin() ⇒ sets to zero", () => {
    send(calldata(SELECTOR.RESET));
    expectHex(calldata(SELECTOR.IS_ZERO), "0x01");
  });
});
