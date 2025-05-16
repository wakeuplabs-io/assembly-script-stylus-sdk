#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# CONFIG ── edit if you use different keys / RPC
# ──────────────────────────────────────────────────────────────
RPC_URL="http://localhost:8547"
# funded dev-node key (same you pass to cargo-stylus)
PRIVATE_KEY="0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659"

# ──────────────────────────────────────────────────────────────
# 1. Build IR → wasm (packages/as-stylus)
# ──────────────────────────────────────────────────────────────
echo "🔧  Building IR → AssemblyScript → wasm…"
pushd packages/as-stylus > /dev/null
npm run build
popd > /dev/null

# ──────────────────────────────────────────────────────────────
# 2. Compile, check, deploy the contract (packages/contracts/test)
# ──────────────────────────────────────────────────────────────
pushd packages/contracts/test > /dev/null
npm run compile
npm run check

echo "🚀  Deploying contract…"
DEPLOY_LOG=$(PRIVATE_KEY=$PRIVATE_KEY npm run deploy)

# scrape the address: everything after `deployed code at address: `
CONTRACT_ADDRESS=$(echo "$DEPLOY_LOG" | grep -oE 'deployed code at address: 0x[0-9a-fA-F]+' | awk '{print $5}')
echo "📍  Contract deployed at: $CONTRACT_ADDRESS"
popd > /dev/null

# export so cast can pick it up if you call other scripts
export CONTRACT_ADDRESS

# ──────────────────────────────────────────────────────────────
# 3. cast send  ⇒ increment()
#    Selector   ⇒ 0x696e6372
# ──────────────────────────────────────────────────────────────
echo "✉️  Sending increment(“1”)…"
cast send                 \
  --rpc-url  $RPC_URL     \
  --private-key $PRIVATE_KEY \
  $CONTRACT_ADDRESS 0x696e6372

# ──────────────────────────────────────────────────────────────
# 4. cast call ⇒ get()  (selector 0x67657400)
# ──────────────────────────────────────────────────────────────
VALUE=$(cast call --rpc-url $RPC_URL $CONTRACT_ADDRESS 0x67657400)
echo "📈  Counter value: $VALUE"

# simple assertion
[[ "$VALUE" == "1" ]] && echo "✅  E2E test passed" || {
  echo "❌  Unexpected value: $VALUE"
  exit 1
}
