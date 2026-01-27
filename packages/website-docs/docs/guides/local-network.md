# Local Network

Running a local Arbitrum Stylus network allows you to develop and test your contracts without deploying to testnets or mainnet. This provides faster iteration, no gas costs, and full control over the network state.

The AS-Stylus SDK supports running a local Nitro node (Arbitrum's execution environment) in two ways:

- **Docker Image** (Recommended) - Quick setup using a pre-built Docker container
- **Nitro Devnode** - Pre-configured local network with pre-funded wallets

## Docker Image (Recommended)

The easiest way to run a local network is using the official Nitro Docker image. This is the method used automatically by the SDK's test framework.

### Quick Start with Docker

Start a local Nitro node using Docker:

```bash
docker run -d --rm \
  --name as-stylus-testnode-8547 \
  -p 8547:8547 \
  offchainlabs/nitro-node:v3.9.4-7f582c3 \
  --dev \
  --http.addr 0.0.0.0 \
  --http.api=net,web3,eth,debug
```

This command:
- Runs Nitro in development mode (`--dev`)
- Exposes the RPC endpoint on port `8547`
- Enables JSON-RPC APIs for network, web3, eth, and debug operations
- Automatically removes the container when stopped (`--rm`)

### Verify the Node is Running

Check if the node is ready:

```bash
curl -X POST http://localhost:8547 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

You should receive a response with the chain ID.

### Automatic Node Management in Tests

Projects generated with `npx @wakeuplabs/as-stylus generate` include a `globalSetup.ts` file that automatically starts the Nitro node before running tests. The setup script:

- Checks if a node is already running
- Starts the Docker container if needed
- Waits for the node to be ready (up to 3 minutes)
- Handles cleanup automatically

Your test configuration should point to the local node:

```typescript
// config.ts
export const config = {
  rpcUrl: "http://localhost:8547",
  privateKey: process.env.PRIVATE_KEY as Hex,
  // ... other config
};
```

### Using Local Network in Tests

Configure your test clients to use the local network:

```typescript
import { ChainId, getPublicClient, getWalletClient } from "@wakeuplabs/as-stylus";

const publicClient = getPublicClient(
  ChainId.LocalArbitrumSepolia,
  "http://localhost:8547"
);

const walletClient = getWalletClient(
  ChainId.LocalArbitrumSepolia,
  privateKey,
  "http://localhost:8547"
);
```

### Stopping the Docker Container

Stop the running container:

```bash
docker stop as-stylus-testnode-8547
```

Or if you need to force stop:

```bash
docker kill as-stylus-testnode-8547
```

## Using Nitro Devnode

For development and testing, you can use the Nitro devnode which provides a pre-configured local Arbitrum network with pre-funded wallets. This saves you the effort of wallet provisioning or running out of tokens to send transactions.

Stylus is available on Arbitrum Sepolia, but using the devnode gives you a local environment that mimics the testnet without needing testnet tokens.

### Prerequisites

- **Docker** (required for running the devnode)
- **Git** (for cloning the repository)

### Install the Devnode

Clone the Nitro devnode repository:

```bash
git clone https://github.com/OffchainLabs/nitro-devnode.git
cd nitro-devnode
```

### Launch the Devnode

Run the devnode script:

```bash
./run-dev-node.sh
```

This script will:
- Start a local Arbitrum Nitro node in development mode
- Pre-fund multiple test wallets with ETH
- Expose the RPC endpoint (typically on port 8547)
- Set up the network for Stylus contract deployment

### Pre-funded Wallets

The devnode automatically creates and funds several test wallets, saving you from:
- Manually provisioning wallets
- Requesting testnet tokens from faucets
- Running out of tokens during development

You can use these pre-funded wallets directly in your tests and deployments without any additional setup.

### Verify the Devnode is Running

Check if the devnode is ready:

```bash
curl -X POST http://localhost:8547 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

You should receive a response with the chain ID.

### Stopping the Devnode

To stop the devnode, you can use `Ctrl+C` if running in the foreground, or find and stop the Docker container:

```bash
docker ps | grep nitro
docker stop <container-id>
```

### Development Mode Features

When running in `--dev` mode, Nitro provides:

- **Instant block production** - No need to wait for block times
- **Pre-funded accounts** - Test accounts come with ETH automatically
- **Fast finality** - Transactions are confirmed immediately
- **Full debugging** - Access to debug APIs for troubleshooting

## Network Configuration

### Local Network Settings

When connecting to a local Nitro node, use these settings:

- **RPC URL**: `http://localhost:8547`
- **Chain ID**: `412346` (default for dev mode)
- **Network Name**: `LocalArbitrumSepolia` (in SDK)

### Environment Variables

Configure your `.env` file for local development:

```bash
# Local Network
RPC_URL=http://localhost:8547
PRIVATE_KEY=your_test_private_key_here
```

:::tip

For local testing, you can use any private key. The SDK provides pre-configured test accounts via `getTestAccount()` that are automatically funded on local networks.

:::

### Using Local Network for Deployment

Deploy contracts to your local network:

```bash
npx @wakeuplabs/as-stylus compile src/contracts/contract.ts --endpoint http://localhost:8547

npm run deploy src/contracts/contract.ts \
  --private-key $PRIVATE_KEY \
  --endpoint http://localhost:8547
```

## Test Accounts

The SDK provides pre-configured test accounts that are automatically funded on local networks:

```typescript
import { getTestAccount, TESTS_ACCOUNTS_NAME } from "@wakeuplabs/as-stylus";

// Get pre-funded test accounts
const deployer = getTestAccount(TESTS_ACCOUNTS_NAME.Deployer);
const alice = getTestAccount(TESTS_ACCOUNTS_NAME.Alice);
const bob = getTestAccount(TESTS_ACCOUNTS_NAME.Bob);
```

These accounts are perfect for testing multi-user scenarios without manual account setup or funding.

## Troubleshooting

### Port Already in Use

If port `8547` is already in use, you can:

1. **Stop the existing container**:
   ```bash
   docker stop as-stylus-testnode-8547
   ```

2. **Use a different port**:
   ```bash
   docker run -d --rm \
     --name as-stylus-testnode-8548 \
     -p 8548:8547 \
     offchainlabs/nitro-node:v3.9.4-7f582c3 \
     --dev --http.addr 0.0.0.0 --http.api=net,web3,eth,debug
   ```
   
   Then update your RPC URL to `http://localhost:8548`.

### Node Not Starting

If the node fails to start:

1. **Check Docker is running**: `docker ps`
2. **Check logs**: `docker logs as-stylus-testnode-8547`
3. **Verify image exists**: `docker images | grep nitro-node`
4. **Pull the image**: `docker pull offchainlabs/nitro-node:v3.9.4-7f582c3`

### Connection Timeout

If you're experiencing connection timeouts:

1. **Verify the node is running**: Check with `curl` command above
2. **Check firewall settings**: Ensure port 8547 is accessible
3. **Increase timeout**: The default timeout is 3 minutes (180000ms)

## Next Steps

With a local network running, you can:

- Run tests against a local blockchain
- Develop contracts without testnet deployment
- Test complex scenarios with full control over network state
- Debug transactions with full access to debug APIs

For more information on testing, see the [Testing Smart Contracts](./testing-contracts) guide.
