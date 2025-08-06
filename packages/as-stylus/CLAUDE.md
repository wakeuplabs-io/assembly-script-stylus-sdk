# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the AS-Stylus SDK package.

## Project Overview

AS-Stylus SDK - A comprehensive SDK that enables developers to write Arbitrum Stylus smart contracts using TypeScript/AssemblyScript. This package provides the complete toolchain for transpiling TypeScript to AssemblyScript and compiling to WebAssembly for deployment on Arbitrum Stylus.

**Recent Major Updates:**
- **Checked-by-default arithmetic**: U256/I256 operations now panic on overflow/underflow (Solidity 0.8+ semantics)
- **Memory-based API**: All arithmetic operations return new instances instead of modifying in-place
- **Function call support**: Fixed transformer to handle internal contract function calls
- **Comprehensive JSDoc**: All core types now have complete English documentation
- **Buffer operations**: Fixed event/error data copying with `U256.copyInPlace()`

## Common Commands

### Build and Development
- `npm run pre:build` - **REQUIRED** Compile TypeScript and resolve aliases (must run before most commands)
- `npm run generate` - Generate a new contract project
- `npm run test:unit` - Run unit tests only
- `npm run test:e2e` - Run end-to-end tests (requires blockchain connection)
- `npm run test` - Run all end-to-end tests
- `npm run test:watch` - Run tests in watch mode

### Contract Development Workflow
1. `as-stylus generate <project-name>` - Create new contract project
2. `as-stylus compile <contract-file>` - Compile TypeScript to WASM via AssemblyScript
3. From contract directory: `cargo stylus check --endpoint <RPC_URL>` - Validate WASM
4. From contract directory: `cargo stylus deploy --private-key <KEY> --endpoint <RPC_URL>` - Deploy

### Testing Specific Contracts
- `npm test -- --testNamePattern="Expert Counter" --testPathPattern="e2e.expert-counter.test.ts" --verbose`
- `npm test -- --testPathPattern="e2e.counter.test.ts"`
- `npm test -- --testNamePattern="should increment" --verbose`

## Architecture Deep Dive

### Core System Components

#### 1. CLI System (`cli/`)
Command-based architecture using Commander.js:

**Commands Structure:**
```
cli/commands/
├── generate/          # Project scaffolding
│   ├── generate-runner.ts    # Implementation
│   ├── generate.ts          # CLI interface
│   └── generator/           # Template generation logic
├── compile/           # TypeScript → AssemblyScript → WASM
│   ├── compile-runner.ts
│   └── compile.ts
├── deploy/            # Contract deployment
├── clean/             # Artifact cleanup
└── lint/              # Code validation
```

**Key Files:**
- `cli/index.ts` - Main CLI dispatcher
- `cli/commands/compile/compile-runner.ts` - Compilation orchestration

#### 2. Transformation System (`cli/commands/build/transformers/`)

**Core Infrastructure:**
- `core/base-transformer.ts:8-69` - `BaseTypeTransformer` abstract class
- `core/interfaces.ts` - `ExpressionHandler` and `TypeTransformer` interfaces
- `core/emit-contract.ts:67-100` - Main contract code generation orchestrator
- `core/transform-ir.ts` - Entry point for IR → AssemblyScript transformation

**Type-Specific Transformers:**
```
transformers/
├── u256/
│   ├── u256-transformer.ts
│   └── handlers/
│       ├── create-handler.ts         # U256Factory.create()
│       ├── operation-handler.ts      # add, sub, mul, div (checked by default)
│       ├── comparison-handler.ts     # eq, lt, gt
│       ├── copy-handler.ts           # U256.copy() - creates new instances
│       ├── from-string-handler.ts    # U256Factory.fromString()
│       ├── function-call-handler.ts  # Internal contract function calls
│       └── to-string-handler.ts      # String conversion
├── i256/              # 256-bit signed integers (same handler pattern)
│   ├── i256-transformer.ts
│   └── handlers/
│       ├── operation-handler.ts      # Checked arithmetic (with unchecked variants)
│       ├── negate-handler.ts         # I256.negate() - returns new instance
│       ├── abs-handler.ts            # I256.abs() returns U256
│       ├── from-u256-handler.ts      # I256Factory.fromU256()
│       └── from-string-handler.ts    # I256Factory.fromString()
├── address/           # Ethereum addresses
├── string/            # UTF-8 strings
├── struct/            # Custom structs
├── boolean/           # Boolean values
├── event/             # Event emission (uses U256.copyInPlace)
└── error/             # Error handling (uses U256.copyInPlace)
```

**Handler Pattern Example:**
```typescript
// Each transformer registers multiple handlers
class U256Transformer extends BaseTypeTransformer {
  constructor() {
    super("U256");
    this.registerHandler(new U256CreateHandler());
    this.registerHandler(new U256CopyHandler());
    this.registerHandler(new U256FromStringHandler());
    this.registerHandler(new U256FunctionCallHandler()); // NEW: handles function calls
    this.registerHandler(new U256OperationHandler());
    this.registerHandler(new U256ComparisonHandler());
    this.registerHandler(new U256ToStringHandler());
  }
}
```

**Critical Handler: Function Call Handler**
```typescript
// Handles internal contract function calls that return U256
export class U256FunctionCallHandler implements ExpressionHandler {
  canHandle(expr: any): boolean {
    return expr.kind === "call" && 
           expr.returnType === "uint256" && 
           !expr.target.startsWith("U256Factory.");
  }
  
  handle(expr: any, context: EmitContext, emitExprFn: Function): EmitResult {
    const argResults = (expr.args || []).map(arg => emitExprFn(arg, context));
    const argExprs = argResults.map(result => result.valueExpr);
    return {
      setupLines: argResults.flatMap(r => r.setupLines),
      valueExpr: `${expr.target}(${argExprs.join(", ")})`,
      valueType: "U256"
    };
  }
}
```

#### 3. Core AssemblyScript Runtime (`core/`)

**Type System (`core/types/`) - All JSDoc documented:**

**Numeric Types (Memory-based API):**
- `u256.ts` - 256-bit unsigned integers with checked arithmetic
  - `static create(): usize` - Zero-initialized U256
  - `static copy(src: usize): usize` - Create copy (returns new instance)
  - `static copyInPlace(dest: usize, src: usize): void` - Copy to existing buffer
  - `static add(a: usize, b: usize): usize` - Checked addition (panics on overflow)
  - `static addUnchecked(a: usize, b: usize): usize` - Wrapping addition
  - `static sub/mul/div/mod()` - All have checked + unchecked variants
  - `static fromString/fromU64()` - Factory methods

- `i256.ts` - 256-bit signed integers with checked arithmetic
  - Same API pattern as U256 but for signed operations
  - `static negate(a: usize): usize` - Returns new negated instance
  - `static abs(a: usize): usize` - Returns new U256 (absolute value)
  - `static fromU256(u256: usize): usize` - Conversion from U256

**Other Types:**
- `address.ts` - 20-byte Ethereum addresses with validation
- `str.ts` - UTF-8 strings with Solidity-compatible storage (packed ≤28 bytes, dynamic >28 bytes)
- `mapping.ts` - Storage mapping (key → value) with Keccak256 hashing
- `mapping2.ts` - Nested mapping (key1 → key2 → value) 
- `struct.ts` - Custom struct definitions with ABI encoding/decoding
- `boolean.ts` - Boolean storage operations (32-byte ABI representation)
- `msg.ts` - Message context operations (msg.sender access)

**Runtime Modules (`core/modules/`):**
- `hostio.ts` - Stylus host function bindings (storage_store, storage_load, etc.)
- `storage.ts` - Storage slot management and access patterns
- `memory.ts` - Memory allocation and management (`malloc`, `free`)
- `events.ts` - Event emission (`emit_log`) 
- `errors.ts` - Error handling and panics
- `evm.ts` - EVM-specific operations (msg.sender, msg.value)

#### 4. Compilation Context (`cli/shared/compilation-context.ts:3-27`)
Global compilation state tracking:
```typescript
interface CompilationContext {
  slotMap: Map<string, number>;           // Storage slot assignments
  eventMap: Map<string, IREvent>;         // Event definitions
  structRegistry: Map<string, IRStruct>;  // Registered struct types
  variableTypes: Map<string, string>;     // Variable type inference
  mappingTypes: Map<string, {...}>;       // Mapping key/value types
  contractName: string;
}
```

### Build Process Flow (Detailed)

1. **TypeScript Parsing** (`cli/commands/build/`)
   - Parse TypeScript contract files using `ts-morph`
   - Extract contract structure, methods, events, storage variables
   - Build Intermediate Representation (IR) with type information
   - Store IR in `artifacts/intermediate-representation/json/`

2. **IR Transformation** (`cli/commands/build/transformers/core/`)
   - Initialize compilation context with contract metadata
   - Register type-specific transformers for the contract's types
   - Walk IR tree and transform each expression using appropriate transformer
   - Generate AssemblyScript code with proper imports and helper functions

3. **AssemblyScript Compilation** (`artifacts/`)
   - Generate `contract.transformed.ts` with AssemblyScript code
   - Create `contract.entrypoint.ts` with Stylus entry point wrapper
   - Use AssemblyScript compiler to generate WASM
   - Output files to `artifacts/build/contract.wasm`

4. **Validation & Deployment** (from contract directory)
   - Validate WASM: `cargo stylus check --endpoint <RPC_URL>`
   - Deploy: `cargo stylus deploy --private-key <KEY> --endpoint <RPC_URL>`
   - Store deployment info in `artifacts/deployments/`

### Type System Architecture

#### Primitive Types (Updated Architecture)

- **U256/I256**: 32-byte big-endian integers with **checked-by-default arithmetic**
  - **Memory-based API**: All operations return new instances, no in-place modification
  - **Checked arithmetic**: `add()`, `sub()`, `mul()`, `div()` panic on overflow/underflow (Solidity 0.8+ semantics)
  - **Unchecked variants**: `addUnchecked()`, `subUnchecked()`, etc. for wrapping behavior
  - **Factory methods**: `U256Factory.create()`, `U256Factory.fromString()`
  - **Memory operations**: `U256.copy()` creates new instances, `U256.copyInPlace()` for buffer copying
  - **Type conversions**: `I256.fromU256()`, `I256.abs()` returns U256

- **Address**: 20-byte Ethereum addresses with validation
  - **Factory**: `AddressFactory.fromString()` with hex validation
  - **Operations**: `equals()`, `toString()`, `isZero()`, `hasCode()`

- **String**: UTF-8 strings with **Solidity-compatible storage layout**
  - **Packed storage**: ≤28 bytes stored inline, >28 bytes use dynamic storage
  - **Factory**: `StringFactory.fromString()` 
  - **Operations**: `length()`, `slice()`, `toString()`

#### Complex Types
- **Mapping<K,V>**: Storage mappings with Keccak256 key hashing
- **MappingNested<K1,K2,V>**: Nested mappings for complex data structures
- **Struct**: Custom types with automatic ABI encoding/decoding

### Testing Architecture

#### Unit Tests (`__tests__/unit/`)
- **validations/** - TypeScript contract validation logic
- Focus on IR generation and transformation correctness
- Mock AssemblyScript compilation for fast feedback
- Run with: `npm run test:unit`

#### E2E Tests (`__tests__/e2e/`)
- Full compilation pipeline: TypeScript → AssemblyScript → WASM
- Deploy contracts to Arbitrum Sepolia testnet or localhost
- Interact with deployed contracts using ethers.js/viem
- 30-second timeout for blockchain operations
- Run with: `npm run test:e2e`

#### Test Contracts (`__tests__/contracts/`)
Each test contract is a complete project with:
```
contracts/expert-counter/
├── contract.ts              # TypeScript contract
├── package.json             # Contract dependencies
├── tsconfig.json           # TypeScript config
└── artifacts/              # Generated after compilation
    ├── contract.transformed.ts    # Generated AssemblyScript
    ├── contract.entrypoint.ts     # Stylus entry point
    ├── abi/contract-abi.json      # Generated ABI
    ├── build/contract.wasm        # Compiled WASM
    └── deployments/               # Deployment history
```

**Available Test Contracts:**
- `counter/` - Basic storage and arithmetic
- `expert-counter/` - Complex math operations and U256 handling (comprehensive test of new checked arithmetic)
- `erc20/`, `erc721/` - Token standard implementations with events
- `erc20-override/` - ERC20 with overridden methods demonstrating inheritance
- `struct/` - Custom struct definitions and operations
- `inheritance/` - Contract inheritance patterns with internal function calls
- `nested-functions/` - Internal function calls returning different types (U256, boolean, string, address)  
- `custom-errors/` - Error handling and revert scenarios
- `admin-registry/` - Administrative patterns with access control

### Development Patterns

#### Working with Test Contracts
1. Navigate to specific contract: `cd __tests__/contracts/expert-counter`
2. Compile from SDK root: `npm run pre:build` then `as-stylus compile contract.ts --endpoint <RPC>`
3. Check WASM from contract dir: `cargo stylus check --endpoint <RPC>`
4. Deploy from contract dir: `cargo stylus deploy --private-key <KEY> --endpoint <RPC>`

#### Adding New Type Transformers
1. Create transformer class extending `BaseTypeTransformer` in `cli/commands/build/transformers/`
2. Implement required methods:
   ```typescript
   matchesType(expr: any): boolean
   generateLoadCode(property: string): string
   generateStoreCode(property: string, valueExpr: string): string
   ```
3. Create handlers for specific operations in `handlers/` subdirectory
4. Register handlers in transformer constructor
5. Add transformer to transformer registry

#### Adding New Core Types
1. Define AssemblyScript class in `core/types/`
2. Implement factory methods, operations, and storage helpers
3. Create corresponding TypeScript interface in `cli/sdk-interface/`
4. Add transformer for TypeScript → AssemblyScript conversion
5. Add test contracts demonstrating usage

### Debugging and Development

#### Compilation Debugging
- Generated files in `artifacts/` show each step of the compilation
- `intermediate-representation/json/` contains IR for debugging
- Verbose compilation logs show transformer decisions
- Use `--verbose` flag with tests for detailed output

#### Memory Management
- **Manual allocation**: Use `malloc()` from `core/modules/memory.ts`
- **Memory-based operations**: All U256/I256 operations return new instances
- **Buffer operations**: Use `U256.copyInPlace()` for copying to existing buffers (events, errors)
- **Automatic cleanup**: Temporary values cleaned up during expression evaluation
- **Storage operations**: Use deterministic slot calculation

#### Key Architectural Decisions

**Checked-by-Default Arithmetic (Solidity 0.8+ semantics):**
```typescript
// DEFAULT: Checked operations (panic on overflow)
value.add(other)     // Panics on overflow
value.sub(other)     // Panics on underflow

// EXPLICIT: Unchecked operations (wrapping behavior)  
value.addUnchecked(other)  // Wraps on overflow
value.subUnchecked(other)  // Wraps on underflow
```

**Memory vs In-Place Operations:**
```typescript
// OLD (in-place): value.add(other) modifies value
// NEW (memory-based): value.add(other) returns new instance
const result = U256.add(a, b);  // Returns new U256

// For buffer copying (events, errors):
U256.copyInPlace(destBuffer, srcU256);  // Copies to existing buffer
```

**Function Call Handling:**
```typescript
// Internal contract function calls now work correctly:
@Internal
static increment(value: U256): U256 {
  return value.add(U256Factory.fromString("1"));
}

@External  
static getIncremented(value: U256): U256 {
  return increment(value);  // ✅ Now transforms correctly
}
```

### Requirements & Dependencies
- **Node.js >= 22.x** (specified in package.json)
- **AssemblyScript >= 0.27.x** for WASM compilation
- **cargo stylus** CLI installed globally for validation/deployment
- **Arbitrum testnet/mainnet access** for contract deployment
- **ethers.js/viem** for contract interaction in tests

### SDK Interface (`cli/sdk-interface/`)
TypeScript interfaces that developers use when writing contracts:
- `address.ts` - Address type interface
- `u256.ts` - U256 type interface
- `mapping.ts` - Mapping type interface
- `decorators.ts` - Contract decorators (@contract, @view, @external)

### Project Templates (`templates/`)
- `counter.ts` - Basic counter contract template
- `entrypoint.ts` - Stylus entry point wrapper template

---

## Common Issues and Solutions

### Compilation Issues

**❌ "Unsupported U256 expression: call functionName"**
- **Problem**: Function call transformers missing
- **Solution**: Ensure `U256FunctionCallHandler` is registered in transformer
- **Fixed**: All function calls returning U256 now supported

**❌ "Type 'void' is not assignable to type 'usize'"**
- **Problem**: Handler returning void instead of expression 
- **Solution**: Update handler to return proper `EmitResult` with `valueExpr`

**❌ "U256.copy expects 1 argument but got 2"**  
- **Problem**: Using old two-parameter copy API
- **Solution**: Use `U256.copyInPlace(dest, src)` for buffer operations, `U256.copy(src)` for new instances

### Type System Issues

**❌ Overflow/Underflow in arithmetic operations**
- **Expected behavior**: Operations now panic on overflow (checked-by-default)
- **For wrapping**: Use explicit unchecked variants: `addUnchecked()`, `subUnchecked()`

**❌ "Function 'internalFunction' not found on ABI"**  
- **Problem**: Trying to call `@Internal` function externally
- **Solution**: Internal functions are not exposed in ABI, call them through `@External` wrapper functions

### Best Practices

✅ **Always use checked arithmetic by default**
✅ **Use explicit unchecked methods only when wrapping behavior is desired**  
✅ **Document JSDoc for all new types and functions in English**
✅ **Test both checked and unchecked variants in test contracts**
✅ **Use `copyInPlace()` for buffer operations, `copy()` for new instances**
✅ **Prefer memory-based API over in-place modifications**

### Testing Guidelines

- Run `npm run pre:build` before any compilation
- Use specific test patterns: `npm test -- --testPathPattern="contract-name"`
- Check artifacts in `__tests__/contracts/*/artifacts/` for debugging
- Verify ABI generation in `abi/contract-abi.json`
- Test inheritance with both parent and child method calls