import fs from "fs";
import path from "path";

export function buildEnvSample(targetPath: string) {
  fs.writeFileSync(
    path.join(targetPath, ".env.sample"),
    `
DEPLOY_TIMEOUT=300000

# This private key is used for testing in local blockchain
PRIVATE_KEY=0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659

# This URL is used for testing in local blockchain
RPC_URL=http://localhost:8547
    `,
  );
}
