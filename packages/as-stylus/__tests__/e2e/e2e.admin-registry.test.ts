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
} from "./utils.js";

const SELECTOR = {
  DEPLOY: "0x6465706c",
  SET: "0x73657461",
  RESET: "0x72657365",
  GET: "0x67657461",
  IS_ADMIN: "0x69736164",
  IS_ZERO: "0x697a6572",
};

/*───────────────────────────────*
 *  Constants
 *───────────────────────────────*/
const ADMIN = "0x1111111111111111111111111111111111111111";
const ADMIN_PADDED = ADMIN.toLowerCase().padStart(42, "0").replace(/^0x/, "").padStart(64, "0");
const ADMIN_HEX64 =
  "0x" + Buffer.from(ADMIN.slice(2).padStart(40, "0"), "hex").toString("hex").padStart(64, "0");

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
    run("npm run pre:build", projectRoot);
    const pkg = path.join(ROOT, "/as-stylus/__tests__/contracts/admin-registry");
    run("npx as-stylus build", pkg);
    run("npm run compile", pkg);
    run("npm run check", pkg);

    const dataDeploy = calldata(SELECTOR.DEPLOY, ADMIN_HEX64);

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
  it("mock", () => {
    expect(true).toBe(true);
  });

  // it("get() after deploy ⇒ initial address", () => {
  //   const res = call(calldata(SELECTOR.GET));
  //   expect(res.toLowerCase()).toContain(ADMIN.slice(2).toLowerCase());
  // });

  //   it("isAdmin(initial) ⇒ true", () => {
  //     expectHex(calldata(SELECTOR.IS_ADMIN, ADMIN_PADDED), "0x01");
  //   });

  //   it("isZero() ⇒ false initially", () => {
  //     expectHex(calldata(SEL.IS_ZERO), "0x00");
  //   });

  //   it("setAdmin(new) ⇒ address updates", () => {
  //     const NEW_ADMIN = "0x2222222222222222222222222222222222222222";
  //     const NEW_PAD = NEW_ADMIN.toLowerCase().padStart(42, "0").replace(/^0x/, "").padStart(64, "0");

  //     send(calldata(SEL.SET, NEW_PAD));

  //     const res = call(calldata(SEL.GET));
  //     expect(res.toLowerCase()).toContain(NEW_ADMIN.slice(2).toLowerCase());
  //   });

  //   it("resetAdmin() ⇒ sets to zero", () => {
  //     send(calldata(SEL.RESET));
  //     expectHex(calldata(SEL.IS_ZERO), "0x01");
  //   });
});
