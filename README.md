# Stylus AssemblyScript SDK


> ⚠️ **ALPHA VERSION NOTICE**
>
> This SDK is **not intended for use** at this stage.
> It is in **early alpha development**, unstable, and subject to **major breaking changes**.
> **Do not use** this SDK in any production, staging, or testnet environments.
> We **strongly advise against integrating or deploying** this code until a stable release is announced.

A comprehensive SDK that enables developers to write **Arbitrum Stylus smart contracts** using Typescript and transpiled to **AssemblyScript**. This project provides a familiar development environment for JavaScript/TypeScript developers who want to build high-performance smart contracts that compile to WebAssembly.

## What is this project?

The Stylus AssemblyScript SDK is a complete development toolkit for creating Arbitrum Stylus contracts using AssemblyScript. Stylus is Arbitrum's next-generation smart contract platform that allows developers to write contracts in languages other than Solidity, compiling them to WebAssembly for near-native execution speeds.

This monorepo contains three main components:

### [SDK Core](./packages/as-stylus/) | [NPM Package](https://www.npmjs.com/package/@wakeuplabs/as-stylus)
- Learn the SDK through interactive examples

### [SDK Core](./packages/as-stylus/)
The main SDK package that provides:
- AssemblyScript bindings for Stylus host functions
- Type-safe storage and memory management
- Event emission and error handling
- CLI tools for project scaffolding, compilation, and deployment
- Built-in support for common standards such as ERC20, ERC721

### [Interactive Playground](./packages/playground/) | [Live Playground](https://as-stylus-playground.wakeuplabs.link/)
A web-based playground that allows developers to:
- Try out ERC20 and ERC721 contract examples in the browser
- Interact with own contracts
- Learn the SDK through interactive examples

### [Documentation Website](./packages/website-docs/) | [Live Docs](https://as-stylus.wakeuplabs.io/)
Comprehensive documentation that covers:
- Getting started guides
- API reference
- Contract examples and patterns

## Key Features

- **Type Safety**: Full ***TypeScript/AssemblyScript*** type safety for smart contract development
- **Performance**: Compile to WebAssembly for near-native execution speeds
- **Developer Experience**: Familiar syntax for ***JavaScript/TypeScript developers***
- **Comprehensive Tooling**: Complete CLI for scaffolding, building, testing, and deploying
- **Standard Library**: Built-in implementations of common contract patterns
- **Testing Framework**: Integrated testing utilities for contract validation

## Quick Start

### Installation (optional)

Use npx (recommended), or install globally if you prefer.

```bash
# Option A: npx (no install)
npx @wakeuplabs/as-stylus --version

# Option B: global install
npm install -g @wakeuplabs/as-stylus
```

### Generate a new project

```bash
npx @wakeuplabs/as-stylus generate my-contract
cd my-contract
```

### Build and deploy

```bash
npx @wakeuplabs/as-stylus compile <contract-file> --endpoint <rpc-url>    # build artifacts, Compile to WASM and check Validate with cargo stylus
npm run deploy <contract-file> --endpoint <rpc-url>                       # Deploy to Arbitrum
```

## Developer Workflow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant CLI as as-stylus CLI
    participant TS as TypeScript Files
    participant ASC as AssemblyScript Compiler
    participant Artifacts as Artifacts/Entrypoint
    participant Tests as Testing Framework
    participant Arbitrum as Arbitrum Network

    Dev->>CLI: as-stylus generate my-contract
    CLI->>CLI: Create project structure
    CLI->>TS: Generate contract.ts template
    CLI->>CLI: Setup package.json & tsconfig
    CLI-->>Dev: Project scaffolded with boilerplate

    Dev->>TS: Write contract logic
    TS-->>Dev: TypeScript contract code

    Dev->>CLI: as-stylus compile ./contract.ts  --endpoint <RPC_URL>
    CLI->>TS: Read contract.ts
    CLI->>Artifacts: Generate Stylus entrypoint wrapper
    CLI->>Artifacts: Create artifacts/ directory
    CLI-->>Dev: Stylus entrypoint generated

    CLI->>ASC: Transpile TypeScript to AssemblyScript
    ASC->>ASC: Type checking & validation
    ASC->>ASC: Generate WASM bytecode
    ASC-->>CLI: WASM file created
    CLI-->>Dev: Compilation to WASM complete

    CLI->>Stylus: cargo stylus check ./artifacts/build/contract.wasm  --endpoint <RPC_URL>
    Stylus->>Stylus: Validate WASM bytecode
    Stylus->>Stylus: Check Stylus host function compatibility
    Stylus->>Stylus: Verify contract size limits
    Stylus-->>CLI: Validation results
    CLI-->>Dev: Contract validated for Stylus

    Dev->>CLI: npm run deploy ./contract.ts --private-key <PRIVATE_KEY> --endpoint <RPC_URL>
    CLI->>Stylus: cargo stylus deploy --private-key
    Stylus->>Arbitrum: Submit contract deployment transaction
    Arbitrum->>Arbitrum: Store contract bytecode on-chain
    Arbitrum->>Arbitrum: Assign contract address
    Arbitrum-->>Stylus: Deployment receipt with address
    Stylus-->>CLI: Contract deployed successfully
    CLI-->>Dev: Contract live at address: 0x...
```

## Project Structure

```
assembly-script-stylus-sdk/
│
├── packages/
│   ├── as-stylus/          # Main SDK package
│   │   ├── __tests__/      # end to end tests
│   │   ├── core/           # AssemblyScript modules and types
│   │   ├── cli/            # CLI commands and tools
│   │   └── templates/      # Project templates
│   │
│   ├── playground/        # Interactive web playground
│   │   ├── app/           # Next.js application
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities and services
│   │   └── abis/          # abis for example contracts
│   │
│   └── website-docs/      # Documentation website
│       ├── docs/          # Documentation content
│       └── src/           # Website code
```

## Requirements

- Node.js >= 18.x
- AssemblyScript >= 0.27.x
- `cargo stylus` (Globally installed Rust CLI)

## Resources

- [Assembly Script Stylus Documentation](https://as-stylus.wakeuplabs.io/)

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
