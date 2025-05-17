// tests/e2e.counter.test.ts
import { execSync } from "child_process";
import path from "path";
import { config } from "dotenv";
config();

const ROOT = path.resolve(__dirname, "../");
const RPC_URL = process.env.RPC_URL ?? "http://localhost:8547";
const PK = process.env.PRIVATE_KEY;
if (!PK) throw new Error("Set PRIVATE_KEY env");

function run(cmd: string, cwd = ROOT): string {
    return execSync(cmd, { cwd, stdio: "pipe", encoding: "utf8" }).trim();
}

describe("Counter e2e", () => {
    let contractAddr = "";

    // ────────────────────────────────────────────────────────────
    // 1. Build & deploy once for all tests
    // ────────────────────────────────────────────────────────────
    beforeAll(() => {
        // Step 1: build IR → wasm
        run("npm run build");
        console.log("✅ Build OK");

        // Step 2: compile / check / deploy
        const testPkg = path.join(ROOT, "../../contracts/test");
        run("npm run compile", testPkg);
        console.log("✅ Compile OK");
        run("npm run check", testPkg);
        console.log("✅ Check OK");

        const deployLog = run(
            `PRIVATE_KEY=${PK} npm run deploy`,
            testPkg
        );
        console.log("✅ Deploy OK");
        const clean = deployLog.replace(/\x1B\[[0-9;]*m/g, "");
        const m = clean.match(/deployed code at address:\s*(0x[0-9a-fA-F]{40})/i);
        if (!m) throw new Error("Could not scrape contract address");
        contractAddr = m[1];
        console.log("Deployed at", contractAddr);
    }, 120_000); // allow 2 min for Docker build

    // ────────────────────────────────────────────────────────────
    // 2. Helper to cast send/call
    // ────────────────────────────────────────────────────────────
    function castSend(data: string) {
        run(
            `cast send --rpc-url ${RPC_URL} --private-key ${PK} ${contractAddr} ${data}`
        );
    }

    function castCall(data: string): string {
        return run(`cast call --rpc-url ${RPC_URL} ${contractAddr} ${data}`);
    }

    // ────────────────────────────────────────────────────────────
    // 3. Tests
    // ────────────────────────────────────────────────────────────
    it("initial counter is 0", () => {
        const val = castCall("0x67657400"); // get()
        console.log("Counter", val);
        expect(val).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    // it("increment once → counter == 1", () => {
    //     castSend("0x696e6372"); // increment()
    //     const val = castCall("0x67657400");
    //     expect(val).toBe("1");
    // });

    // it("increment twice → counter == 2", () => {
    //     castSend("0x696e6372");
    //     const val = castCall("0x67657400");
    //     expect(val).toBe("2");
    // });
});
