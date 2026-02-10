# Deployment Overview

The AS-Stylus SDK provides flexible ways to deploy your smart contracts to Arbitrum Stylus networks. This guide prepares the common setup and configuration needed to deploy and initialize a contract.

In this section, we'll cover the setup required for deployment:

- **Required setup** - Environment configuration and network access
- **Network configuration** - Setting up Arbitrum network connections
- **Environment variables** - Securely storing deployment credentials

:::tip

You can use services like [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/) to get an Arbitrum RPC URL. For testnet ETH, use Arbitrum Sepolia faucets.

:::

## Required Setup

This guide assumes you have initialized a project using `npx @wakeuplabs/as-stylus generate`. If you haven't, follow the [Getting Started](../Getting%20Started/quick-start) guide first.

You'll need:

- Access to an Arbitrum RPC URL (for Arbitrum Sepolia testnet or Arbitrum One mainnet)
- An account with Arbitrum ETH (or Sepolia ETH for testnet)
- A private key for the deployment account

## Network Configuration

When you generate a project with `npx @wakeuplabs/as-stylus generate`, your project structure includes deployment scripts. The deployment process uses environment variables for configuration.

### Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# Arbitrum Sepolia Testnet (recommended for testing)
RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
PRIVATE_KEY=your_private_key_here

# Or for Arbitrum One Mainnet
# RPC_URL=https://arb1.arbitrum.io/rpc
# PRIVATE_KEY=your_private_key_here
```

:::caution

**Security Warning**: Never commit your `.env` file or private keys to version control. Make sure `.env` is in your `.gitignore` file. Only use testnet private keys for testing purposes and never store valuable assets with them.

:::

### Using Environment Variables

The SDK's deployment commands read these environment variables:

```bash
# Compile your contract
npx @wakeuplabs/as-stylus compile contract.ts --endpoint $RPC_URL

# Deploy your contract
npm run deploy contract.ts --private-key $PRIVATE_KEY --endpoint $RPC_URL
```

Alternatively, you can use the environment variables directly in your scripts or pass them inline (though this is less secure):

```bash
npx @wakeuplabs/as-stylus compile contract.ts --endpoint <RPC_URL>
npm run deploy contract.ts --private-key <PRIVATE_KEY> --endpoint <RPC_URL> --constructor-args <args...>
```

## Project Structure

A typical AS-Stylus project structure looks like this:

```
my-contract/
├── src/
│   └── contracts/
│       └── contract.ts      # Your contract source
├── artifacts/                # Generated build artifacts
│   ├── build/               # Compiled WASM files
│   └── abi/                 # Contract ABI files
├── .env                      # Environment variables (not committed)
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## Deployment Workflow

The typical deployment workflow consists of:

1. **Compile** - Compile your TypeScript contract to WebAssembly
3. **Deploy** - Deploy the contract to Arbitrum

### Compilation

```bash
npx @wakeuplabs/as-stylus compile src/contracts/contract.ts --endpoint $RPC_URL
```

This command:
- Transpiles TypeScript to AssemblyScript
- Compiles to WebAssembly
- Validates with cargo-stylus
- Generates the ABI

### Deployment

```bash
npm run deploy src/contracts/contract.ts \
  --private-key $PRIVATE_KEY \
  --endpoint $RPC_URL \
  --constructor-args <arg1> <arg2> ...
```

This command:
- Uses the compiled WASM from the artifacts folder
- Deploys to the specified Arbitrum network
- Calls the constructor with provided arguments
- Returns the deployed contract address

## Network Options

### Arbitrum Sepolia (Testnet)

**Recommended for development and testing**

- RPC URL: `https://sepolia-rollup.arbitrum.io/rpc`
- Chain ID: `421614`
- Faucet: Use Arbitrum Sepolia faucets to get testnet ETH

### Arbitrum One (Mainnet)

**For production deployments**

- RPC URL: `https://arb1.arbitrum.io/rpc`
- Chain ID: `42161`
- Requires real ETH for gas fees

## Next Steps

With the setup in place, you can now:

- Deploy your first contract using the CLI commands
- Learn about contract initialization and constructor arguments
- Explore advanced deployment patterns and scripts

For more detailed deployment examples, check out the [Examples](../examples/erc20) section.
