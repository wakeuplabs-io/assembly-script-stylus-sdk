# Project Breakdown

This comprehensive guide provides an in-depth look at the AssemblyScript Stylus SDK's architecture, components, and development workflow. After completing the [Quick Start](quick-start) guide, this breakdown will help you understand the full capabilities and design philosophy of the SDK.

## Platform Components

Our monorepo contains three main components designed to provide a complete development experience:

### 🛠️ [SDK Core](https://www.npmjs.com/package/@wakeuplabs/as-stylus)

The main SDK package that provides:

- AssemblyScript bindings for Stylus host functions
- Type-safe storage and memory management
- Event emission and error handling
- CLI tools for project scaffolding, compilation, and deployment
- Built-in support for common standards (ERC20, ERC721)

### 🎮 [Interactive Playground](https://as-stylus-playground.wakeuplabs.link/)

A web-based playground that allows developers to:

- Try out ERC20 and ERC721 contract examples in the browser
- Interact with deployed contracts
- Learn the SDK through interactive examples

### 📚 [Documentation Website] (https://as-stylus.wakeuplabs.io/)

Comprehensive documentation covering:

- Getting started guides and tutorials
- API reference and examples
- Best practices and patterns
- Migration guides and troubleshooting

## Key Features

- **TypeScript/AssemblyScript Syntax**: Write contracts using familiar TypeScript decorators and syntax
- **Type Safety**: Full compile-time type checking and validation
- **Performance**: Compile to WebAssembly for near-native execution speeds on Stylus
- **Developer Experience**: Comprehensive CLI tooling and familiar development workflow
- **Rich Type System**: Support for U256, I256, Address, Str, Boolean, Mapping, and Struct types
- **Event System**: Emit events with proper ABI encoding
- **Error Handling**: Custom error types with revert functionality
- **Standard Library**: Built-in implementations of common contract patterns

## Developer Workflow

The SDK provides a streamlined development workflow from scaffolding to deployment:

![Developer Workflow Sequence Diagram](../../static/img/sequence-diagram.png)

## Core Concepts

### Decorators

Decorators define the behavior and visibility of your contract components:

- **@Contract**: Marks a class as a smart contract entry point
- **@External**: Makes methods callable from external transactions
- **@View**: Marks read-only methods that don't modify state
- **@Event**: Defines event structures for logging
- **@Error**: Creates custom error types for revert functionality

### Data Types

The SDK provides blockchain-optimized types for efficient development:

- **U256/I256**: 256-bit unsigned/signed integers with arithmetic operations
- **Address**: Ethereum addresses with built-in validation
- **String**: Dynamic strings with storage optimization
- **Boolean**: Boolean values with proper 32-byte storage alignment
- **Mapping**: Persistent key-value storage mappings
- **Struct**: Custom data structures with automatic serialization

## Project Structure

When you generate a new project, you'll get this structure:

```
my-contract/
├── contract.ts          # Your main contract file
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── artifacts/           # Generated build artifacts
    ├── build/           # Compiled WASM files
    └── abi/             # Contract ABI files
```

### File Breakdown

- **contract.ts**: Your main contract implementation with TypeScript decorators
- **package.json**: Contains project dependencies and helpful npm scripts for building and deploying
- **tsconfig.json**: TypeScript configuration optimized for AssemblyScript compilation
- **artifacts/**: Generated during compilation, contains WASM bytecode and ABI definitions

## Architecture Deep Dive

### Compilation Pipeline

1. **TypeScript Source**: Your contract written with familiar TypeScript syntax
2. **AssemblyScript Transpilation**: TypeScript decorators are processed and converted to AssemblyScript
3. **WebAssembly Compilation**: AssemblyScript is compiled to optimized WASM bytecode
4. **Stylus Validation**: The WASM is validated for compatibility with Arbitrum Stylus
5. **Deployment**: Contract is deployed to Arbitrum with proper initialization

### Memory Management

The SDK provides efficient memory management through:

- **Stack-based Storage**: For temporary variables and function parameters
- **Persistent Storage**: For contract state using optimized storage slots
- **Memory Pools**: For dynamic allocations with automatic cleanup

### Gas Optimization

- **Efficient Encoding**: Automatic optimization of data serialization
- **Storage Patterns**: Optimized storage layouts to minimize gas costs
- **Function Inlining**: Compile-time optimizations for frequently used operations

## Development Best Practices

### Contract Design

1. **State Management**: Use appropriate data types for your use case
2. **Function Visibility**: Properly mark functions as @External or @View
3. **Error Handling**: Implement comprehensive error checking with custom errors
4. **Event Emission**: Log important state changes for off-chain monitoring

### Testing Strategy

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test contract interactions and workflows
3. **Gas Analysis**: Monitor gas usage and optimize performance
4. **Security Audits**: Review contracts for potential vulnerabilities

## Comprehensive Learning Path

### Learn the Fundamentals

- [Decorators](../decorators/contract) - Define contract structure and behavior
- [Data Types](../types/u256) - Master blockchain-optimized types
- [Data Structures](../structures/mapping) - Organize contract state efficiently

### Build Real Contracts

- [ERC20 Example](../examples/erc20) - Token contract implementation
- [ERC721 Example](../examples/erc721) - NFT contract patterns

### Advanced Topics

- [Error Handling](../decorators/error) - Custom error types and patterns
- [Event System](../decorators/event) - Efficient logging and monitoring
- [Visibility Modifiers](../decorators/visibility) - Access control patterns

### Try it Live

- [Interactive Playground](https://as-stylus-playground.wakeuplabs.link/) - Test concepts in your browser

### Resources

- [NPM Package](https://www.npmjs.com/package/@wakeuplabs/as-stylus)
- [GitHub Repository](https://github.com/your-org/assembly-script-stylus-sdk)

## Next Steps

Ready to build the future of smart contracts? Here are your next steps:

1. **Start with the Basics**: Master the [decorator system](../decorators/contract) and understand how to structure contracts
2. **Learn the Type System**: Dive deep into [U256](../types/u256) and other blockchain-optimized types
3. **Build Your First Token**: Follow the [ERC20 tutorial](../examples/erc20) to create a complete token contract
4. **Explore Advanced Features**: Learn about [events](../decorators/event), [errors](../decorators/error), and [data structures](../structures/mapping)
5. **Deploy to Mainnet**: Use the CLI tools to deploy your contracts to Arbitrum

The AssemblyScript Stylus SDK opens up new possibilities for high-performance smart contract development. With familiar TypeScript syntax and WebAssembly performance, you can build the next generation of decentralized applications!
