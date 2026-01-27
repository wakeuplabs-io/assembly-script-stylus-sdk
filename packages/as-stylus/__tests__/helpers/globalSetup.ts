import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const image = "offchainlabs/nitro-node:v3.9.4-7f582c3";
const containerName = "as-stylus-testnode-8547";
const rpcUrl = "http://localhost:8547";

function isRunning(rpcUrl: string) {
  return fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 }),
  })
    .then((response) => response.ok)
    .catch(() => false);
}

async function startNode() {
  return execAsync(
    `docker run -d --rm --name ${containerName} -p 8547:8547 ${image} --dev --http.addr 0.0.0.0 --http.api=net,web3,eth,debug`,
  );
}

export default async function globalSetup() {
  console.log("🐳 Starting Nitro node...");

  const running = await isRunning(rpcUrl);
  if (running) {
    console.log("✅ Node already running");
    return;
  }

  await startNode();

  const startTime = Date.now();
  const timeout = 180000;
  while (Date.now() - startTime < timeout) {
    const running = await isRunning(rpcUrl);
    if (running) {
      console.log("✅ Node ready");
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Node failed to start");
}
