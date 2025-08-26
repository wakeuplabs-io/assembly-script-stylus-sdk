# CLAUDE.md

This file provides comprehensive guidance for working with the AS-Stylus SDK package.

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
4. `as-stylus deploy <contract-file> --endpoint <RPC_URL> --constructor-args "arg1" "arg2"` - Deploy (will prompt for private key securely)

### Testing Specific Contracts
- `npm test -- --testNamePattern="Expert Counter" --testPathPattern="e2e.expert-counter.test.ts" --verbose`
- `npm test -- --testPathPattern="e2e.counter.test.ts"`
- `npm test -- --testNamePattern="should increment" --verbose`

---

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
# CLAUDE.md
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
   - Deploy: Use `as-stylus deploy contract.ts --endpoint <RPC_URL>` (prompts for private key securely)
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
4. Deploy: `as-stylus deploy contract.ts --endpoint <RPC>` (prompts for private key securely)

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

## Handler System Architecture

### Overview: Hybrid Legacy/Modern System

The AS-Stylus SDK uses a **hybrid approach** combining **legacy handlers** and **modern handlers** to transform TypeScript code to AssemblyScript. This architecture ensures backward compatibility while providing modern type safety and performance benefits.

#### Transformation Flow
```
TypeScript Source → IR (Intermediate Representation) → Transformers → Handlers → AssemblyScript
```

#### Two Coexisting Systems
1. **🏛️ Legacy System**: String pattern matching and simple detection
2. **🚀 Modern System**: Receiver structures and type safety

---

### Legacy Handler System

#### What is the Legacy System?

The legacy system handles expressions using **string pattern matching** and **hybrid targets**.

**Legacy Example:**
```typescript
// INPUT: counter.add(one)
// IR GENERATED: { target: "counter.add", args: [...] }
// DETECTION: target.endsWith(".add")
// OUTPUT: U256.add(counter, one)
```

#### Legacy System Characteristics

**✅ Advantages:**
- **Simplicity**: Easy to understand and implement
- **Stability**: Works well for basic cases
- **Compatibility**: Supports old system syntax
- **Debugging**: Explicit targets facilitate debugging

**❌ Disadvantages:**
- **Not Type Safe**: Uses string matching instead of types
- **Fragile**: Prone to errors with similar targets
- **Not Scalable**: Hard to add new types
- **Performance**: Multiple string checks per expression

#### Current Legacy Handlers

**U256 Legacy Handler Example:**
```typescript
// U256OperationHandler.ts
canHandle(expr: Call): boolean {
  const target = expr.target || "";
  
  // ❌ LEGACY: String pattern matching
  return (
    target.endsWith(".add") ||
    target.endsWith(".sub") ||
    target.endsWith(".mul") ||
    target.endsWith(".div")
  );
}
```

#### Legacy System Problems

**1. Target Conflicts**
```typescript
// ❌ PROBLEM: Both could intercept
"counter.add" // U256?
"string.add" // String? (if existed)
```

**2. No Type Validation**
```typescript
// ❌ PROBLEM: Doesn't validate receiver types
target.endsWith(".lessThan") // Any type could have lessThan
```

**3. Poor Scalability**
```typescript
// ❌ PROBLEM: Adding new methods requires modifying multiple handlers
if (target.endsWith(".newMethod1") || 
    target.endsWith(".newMethod2") || 
    target.endsWith(".newMethod3")) {
  // Each new method = more code
}
```

---

### Modern Handler System

#### What is the Modern System?

The modern system handles expressions using **receiver structures** and **type safety**.

**Modern Example:**
```typescript
// INPUT: counter.add(one)
// IR GENERATED: { target: "add", receiver: { name: "counter", type: "uint256" }, args: [...] }
// DETECTION: expr.receiver.type === AbiType.Uint256 && target === MethodName.Add
// OUTPUT: U256.add(counter, one)
```

#### Modern System Characteristics

**✅ Advantages:**
- **Type Safe**: Uses enums and structured types
- **Scalable**: Easy to add new types and methods
- **Robust**: Compile-time validation
- **Performance**: Fewer string checks, more efficient
- **Maintainable**: Clean and structured code

**❌ Disadvantages:**
- **Complexity**: More initial setup code
- **Learning Curve**: Requires understanding receiver structures
- **Migration Effort**: Migrating legacy system requires effort

#### Current Modern Handlers

**Type-Safe Method Detection:**
```typescript
// U256OperationHandler.ts (modern)
canHandle(expr: Call): boolean {
  const target = expr.target || "";
  
  // ✅ MODERN: Receiver-based validation
  if (expr.receiver) {
    const arithmeticMethods = METHOD_GROUPS.ARITHMETIC;
    return (
      arithmeticMethods.includes(target as (typeof METHOD_GROUPS.ARITHMETIC)[number]) &&
      (expr.receiver.type === AbiType.Uint256 || 
       expr.receiver.returnType === AbiType.Uint256)
    );
  }
  
  // ⚠️ FALLBACK: Legacy support
  return arithmeticMethods.some(method => target.endsWith(`.${method}`));
}
```

**Centralized Type Mappings:**
```typescript
// method-types.ts
export const TYPE_METHOD_RETURNS = {
  [AbiType.Uint256]: {
    [MethodName.Add]: AbiType.Uint256,
    [MethodName.LessThan]: AbiType.Bool,
    // Type-safe, no string hardcoding
  }
};
```

#### Modern System Benefits

**1. Complete Type Safety**
```typescript
// ✅ ADVANTAGE: Compile-time validation
if (target === MethodName.Add) { // Error if MethodName.Add doesn't exist
  // TypeScript catches errors early
}
```

**2. Conflict Resolution**
```typescript
// ✅ ADVANTAGE: Type-based resolution
if (expr.receiver.type === AbiType.Uint256 && target === MethodName.Add) {
  // Only U256.add()
} else if (expr.receiver.type === AbiType.String && target === MethodName.Add) {
  // Only String.add() (if existed)
}
```

**3. Scalability**
```typescript
// ✅ ADVANTAGE: Adding new methods is trivial
export enum MethodName {
  Add = "add",
  NewMethod = "newMethod", // One line
}

// Auto-detected by all handlers using METHOD_GROUPS
```

---

### Current Hybrid System - Coexistence

#### How They Work Together

Currently, handlers support **both systems simultaneously**:

```typescript
// Example: U256OperationHandler hybrid
canHandle(expr: Call): boolean {
  const target = expr.target || "";
  
  // 🚀 MODERN: Receiver-based (priority)
  if (expr.receiver) {
    const arithmeticMethods = METHOD_GROUPS.ARITHMETIC;
    return arithmeticMethods.includes(target as MethodName) &&
           expr.receiver.type === AbiType.Uint256;
  }
  
  // 🏛️ LEGACY: String-based (fallback)
  const arithmeticMethods = METHOD_GROUPS.ARITHMETIC;
  return arithmeticMethods.some(method => target.endsWith(`.${method}`));
}
```

#### Decision Flow
```
Expression Detected
        ↓
Has receiver structure?
        ↓ YES              ↓ NO
   Modern System      Legacy System
        ↓                  ↓
   Type-safe logic   String matching
        ↓                  ↓
   AssemblyScript Output
```

#### Use Cases by System

**🚀 Modern System (Preferred):**
```typescript
// Chained calls
U256Factory.fromString("100").add(counter)

// Modern method calls  
counter.add(one)
address.isZero()
result.mul(three).div(two)
```

**🏛️ Legacy System (Fallback):**
```typescript
// Cases without receiver structure
// Or simple calls from legacy IR
```

---

### Detailed Comparison: Legacy vs Modern

| Aspect | 🏛️ Legacy | 🚀 Modern | 🏆 Winner |
|---------|-----------|------------|-----------|
| **Type Safety** | ❌ String-based | ✅ Type-safe enums | Modern |
| **Performance** | ❌ Multiple string checks | ✅ Efficient type checks | Modern |
| **Scalability** | ❌ Requires handler modifications | ✅ Auto-scaling with enums | Modern |
| **Maintainability** | ❌ Duplicate code | ✅ Centralized types | Modern |
| **Debugging** | ✅ Explicit targets | ⚠️ Requires IR knowledge | Legacy |
| **Simplicity** | ✅ Easy to understand | ❌ More complex | Legacy |
| **Robustness** | ❌ Prone to errors | ✅ Compile-time validation | Modern |
| **Compatibility** | ✅ Backward compatible | ⚠️ Requires migration | Legacy |

**Final Score: Modern 6-2 Legacy**

---

### Migration Requirements

#### Current Coverage Analysis

**Already Modernized Handlers (✅):**
- `U256OperationHandler` - Hybrid (✅ modern + 🏛️ legacy fallback)
- `U256ComparisonHandler` - Hybrid (✅ modern + 🏛️ legacy fallback)
- `U256CreateHandler` - Hybrid (✅ modern + 🏛️ legacy fallback)
- `AddressTransformer` - Hybrid (✅ modern + 🏛️ legacy fallback)
- `StringTransformer` - Hybrid (✅ modern + 🏛️ legacy fallback)

**Pending Modernization Handlers (⚠️):**
- `I256OperationHandler` - Partially modernized
- `BooleanHandlers` - Mostly legacy
- `MappingHandlers` - Legacy system
- `EventHandlers` - Mixed approach
- `StructHandlers` - Legacy system

#### Complete Migration Steps

**Step 1: Extend method-types.ts**
```typescript
// Add all missing types
export const TYPE_METHOD_RETURNS = {
  [AbiType.Uint256]: { /* already exists */ },
  [AbiType.Int256]: { /* already exists */ },
  [AbiType.Address]: { /* already exists */ },
  [AbiType.String]: { /* already exists */ },
  
  // ⚠️ MISSING:
  [AbiType.Bool]: {
    [MethodName.Copy]: AbiType.Bool,
    // Boolean methods
  },
  [AbiType.Mapping]: {
    [MethodName.Get]: AbiType.Unknown, // Dynamic type
    [MethodName.Set]: AbiType.Void,
  },
  [AbiType.Struct]: {
    // Struct-specific methods
  }
};
```

**Step 2: Update IR Builders**
```typescript
// Ensure all IR builders generate receiver structures
// Instead of hybrid targets
```

**Step 3: Modernize Pending Handlers**
```typescript
// Standard pattern for all handlers:
canHandle(expr: IRExpression): boolean {
  if (expr.kind !== "call") return false;
  const target = expr.target || "";
  
  // 🚀 MODERN (priority)
  if (expr.receiver) {
    return this.canHandleModern(expr, target);
  }
  
  // 🏛️ LEGACY (temporary fallback)
  return this.canHandleLegacy(target);
}
```

**Step 4: Comprehensive Testing**
```typescript
// Verify migration doesn't break existing cases
// Especially legacy contracts
```

#### Estimated Effort
- **Time:** 2-3 weeks
- **Risk:** Medium (requires extensive testing)
- **Benefit:** High (code quality + maintainability)

---

### Recommendations and Conclusions

#### 🎯 MAIN RECOMMENDATION: GRADUAL MIGRATION

**Don't migrate everything at once**. Continue with the current hybrid approach with **gradual modernization**.

#### Why not migrate everything now:
1. **✅ Current system works**: 0 compilation errors
2. **⚠️ Regression risk**: Massive changes can break edge cases
3. **🔄 Gradual is safer**: Allows incremental testing
4. **📊 ROI**: Current cost-benefit doesn't justify massive migration

#### 🛣️ RECOMMENDED ROADMAP

**Phase 1: Maintain Hybrid (Current) ✅**
- ✅ **DONE**: Modernize critical handlers (U256, Address, String)
- ✅ **DONE**: Maintain legacy fallbacks
- ✅ **DONE**: Stable and functional system

**Phase 2: Selective Modernization (Next)**
- 🎯 **TODO**: Modernize handlers with more legacy problems
- 🎯 **TODO**: Extend method-types.ts for new types
- 🎯 **TODO**: Improve type safety gradually

**Phase 3: Complete Migration (Future)**
- 🔮 **FUTURE**: Only when necessary (major new features)
- 🔮 **FUTURE**: When legacy maintenance becomes costly
- 🔮 **FUTURE**: Breaking changes requiring rewrite

#### 📈 CRITERIA FOR FUTURE MIGRATION

**Migrate when:**
- ✅ Adding **new complex types** (Struct, Bytes, Arrays)
- ✅ **Critical performance** in transformations
- ✅ **Legacy maintenance** becomes costly
- ✅ **Type safety** is critical for new features

**Don't migrate if:**
- ❌ Current system works well
- ❌ No time for comprehensive testing
- ❌ No clear immediate benefit
- ❌ Risk > Benefit

#### 🏆 FINAL CONCLUSION

**The current hybrid system is OPTIMAL for this moment:**

1. **✅ Complete Functionality**: 0 compilation errors
2. **✅ Best of Both Worlds**: Modern type safety + legacy compatibility
3. **✅ Maintainable**: Easy to add new modern handlers
4. **✅ Scalable**: Clear path for future migration
5. **✅ Stable**: No regressions in existing contracts

**Recommendation: CONTINUE with hybrid system**

There's no urgent need for complete migration. The current system provides the benefits of the modern approach where it matters (type safety, performance) while maintaining the compatibility and stability of the legacy system.

#### 🎯 SUGGESTED NEXT STEPS

1. **✅ Complete**: I256OperationHandler modernization
2. **✅ Add**: Boolean methods to method-types.ts  
3. **✅ Monitor**: Hybrid system performance
4. **✅ Document**: Patterns for future handlers
5. **⚠️ Evaluate**: Migration only when necessary

**The AssemblyScript Stylus SDK has a solid and flexible foundation that supports both modern development and legacy compatibility. This hybrid architecture is the most pragmatic option for continued development.**

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

## Stack Overflow Prevention

### Common Patterns That Cause "Maximum call stack size exceeded"

The transformer/compiler can enter infinite recursion loops with certain code patterns. Here are the most common issues and their solutions:

#### 1. **Nested/Chained Boolean Operations**

**❌ PROBLEMATIC - Causes infinite recursion:**
```typescript
// Nested calls confuse the transformer
const doubleResult = Boolean.fromABI(Boolean.fromABI(x));
const chainedResult = Boolean.toABI(Boolean.toABI(true));

// Ternary with nested calls
return Boolean.fromABI(getFalseFlag()) ? value1 : value2;
```

**✅ CORRECT - Step-by-step operations:**
```typescript
// Break into separate steps
const temp = Boolean.fromABI(x);
const doubleResult = Boolean.fromABI(temp);

// Use intermediate variables
const flagResult = getFalseFlag();
const boolValue = Boolean.fromABI(flagResult);
if (boolValue) {
  return value1;
} else {
  return value2;
}
```

#### 2. **Chained Mathematical Operations**

**❌ PROBLEMATIC - Transformer recursion:**
```typescript
// Too many chained operations
return assets.mul(supply).div(totalAssets).add(U256Factory.fromString("1"));

// Function calls as arguments in chains
return value.add(calculateFee(amount)).mul(getRate());
```

**✅ CORRECT - Divide into steps:**
```typescript
// Step-by-step operations
const step1 = assets.mul(supply);
const step2 = step1.div(totalAssets);
const step3 = U256Factory.fromString("1");
return step2.add(step3);

// Separate function calls
const fee = calculateFee(amount);
const step1 = value.add(fee);
const rate = getRate();
return step1.mul(rate);
```

#### 3. **Ternary Operations (AssemblyScript Limitation)**

**❌ PROBLEMATIC - Not supported:**
```typescript
// Ternary operators cause transformer issues
return supply.equals(zero) ? assets : calculation;
const result = flag ? U256Factory.fromString("1") : U256Factory.fromString("0");
```

**✅ CORRECT - Use explicit if/else:**
```typescript
// Explicit conditional blocks
if (supply.equals(zero)) {
  return assets;
} else {
  return calculation;
}

// Clear branching logic
let result: U256;
if (flag) {
  result = U256Factory.fromString("1");
} else {
  result = U256Factory.fromString("0");
}
return result;
```

#### 4. **Function Calls as Arguments**

**❌ PROBLEMATIC - Recursive call detection:**
```typescript
// Function calls nested in other calls
if (Boolean.fromABI(getFalseFlag())) {
  // transformer gets confused about getFalseFlag() return type
}

// Multiple nested calls
const result = processValue(getValue(getInput()));
```

**✅ CORRECT - Separate the calls:**
```typescript
// Extract function calls first
const flagResult = getFalseFlag();
if (Boolean.fromABI(flagResult)) {
  // Clear and predictable
}

// Step by step
const input = getInput();
const value = getValue(input);
const result = processValue(value);
```

#### 5. **Msg.sender() Pattern (Critical Bug)**

**❌ PROBLEMATIC - Infinite recursion:**
```typescript
// This specific pattern causes infinite loops
Msg.sender()  // Wrong - causes CallTransformer recursion

// Any call to Msg methods
Msg.value()
```

**✅ CORRECT - Use property access:**
```typescript
// Use the property, not method call
msg.sender  // Correct - property access

// For message value
msg.value
```

#### 6. **MappingNested Initialization**

**❌ PROBLEMATIC - Transformer doesn't handle new:**
```typescript
// Using 'new' with MappingNested
static allowances: MappingNested<Address, Address, U256> = new MappingNested();

// This doesn't transform correctly
const mapping = new MappingNested<Address, U256>();
```

**✅ CORRECT - Declaration without initialization:**
```typescript
// Simple declaration
static allowances: MappingNested<Address, Address, U256>;

// SDK handles the initialization automatically
// No need for explicit 'new' calls
```

#### 7. **Union Types (AssemblyScript Limitation)**

**❌ PROBLEMATIC - Not supported by AssemblyScript:**
```typescript
// Union types cause compilation errors
static toABI(value: usize | bool): usize {
  // AssemblyScript doesn't support union types
}

// Multiple type parameters
function process(value: string | U256): void {
}
```

**✅ CORRECT - Use method overloads:**
```typescript
// Separate methods for different types
static toABI(value: bool): usize {
  return Boolean.create(value);
}

static toABIFromPointer(value: usize): usize {
  // Handle pointer case
}

// Or use generic approaches
function processString(value: string): void { }
function processU256(value: U256): void { }
```

### Root Causes Analysis

The transformer fails when:

1. **Expression trees are too deep** - Nested function calls create complex AST trees
2. **Type detection is ambiguous** - Union types, ternaries confuse the type system  
3. **Call chains are complex** - Multiple chained operations overwhelm the transformer
4. **Pattern matching fails** - Specific patterns like `Msg.sender()` trigger recursion bugs

### Debugging Tips

#### Identify the Problem Pattern:
1. **Look for error location** - The stack trace usually points to the problematic line
2. **Check for nested calls** - `func(func(value))` patterns
3. **Look for chained operations** - `a.method1().method2().method3()`
4. **Search for ternary operators** - `condition ? value1 : value2`

#### Quick Fixes:
1. **Add intermediate variables** - Break complex expressions into steps
2. **Use if/else instead of ternary** - More reliable in AssemblyScript
3. **Separate function calls** - Don't nest function calls as arguments
4. **Check Msg patterns** - Use `msg.sender` not `Msg.sender()`

#### Prevention:
- **Maximum 2 operations per line** - Keep expressions simple
- **Clear variable naming** - Use descriptive temporary variables
- **One function call per statement** - Don't nest calls
- **Explicit conditionals** - Avoid ternary operators

### Example: Complex Expression Refactoring

**❌ PROBLEMATIC:**
```typescript
@External
static complexOperation(amount: U256): U256 {
  return amount.mul(getRate()).div(getTotalSupply()).add(
    getFee(amount.mul(U256Factory.fromString("100")))
  );
}
```

**✅ CORRECT:**
```typescript
@External
static complexOperation(amount: U256): U256 {
  // Step 1: Get rate
  const rate = getRate();
  const step1 = amount.mul(rate);
  
  // Step 2: Get total supply
  const totalSupply = getTotalSupply();
  const step2 = step1.div(totalSupply);
  
  // Step 3: Calculate fee
  const multiplier = U256Factory.fromString("100");
  const feeAmount = amount.mul(multiplier);
  const fee = getFee(feeAmount);
  
  // Step 4: Final result
  return step2.add(fee);
}
```

### Testing Guidelines

- Run `npm run pre:build` before any compilation
- Use specific test patterns: `npm test -- --testPathPattern="contract-name"`
- Check artifacts in `__tests__/contracts/*/artifacts/` for debugging
- Verify ABI generation in `abi/contract-abi.json`
- Test inheritance with both parent and child method calls

---

## Gas Optimization and Performance

### Understanding Gas Costs in Stylus

Stylus smart contracts have specific gas consumption patterns that differ from traditional EVM contracts. Understanding these patterns is crucial for writing efficient contracts.

#### High-Cost Operations
1. **Dynamic String Creation**: `U256Factory.fromString()` calls inside loops
2. **Memory Allocation**: Repeated `malloc` calls for temporary values
3. **Complex Nested Calls**: Deep expression trees in single statements
4. **Repeated Type Conversions**: Converting between types multiple times

#### Optimization Strategies

**✅ Pre-declare Constants Outside Loops:**
```typescript
// ❌ EXPENSIVE: Creates strings dynamically in loop
while (counter.lessThan(U256Factory.fromString("10"))) {
  result = result.add(U256Factory.fromString("1"));
  counter = counter.add(U256Factory.fromString("1"));
}

// ✅ EFFICIENT: Pre-declare constants
const ten = U256Factory.fromString("10");
const one = U256Factory.fromString("1");
while (counter.lessThan(ten)) {
  result = result.add(one);
  counter = counter.add(one);
}
```

**✅ Use Intermediate Variables:**
```typescript
// ❌ EXPENSIVE: Complex nested calls
return amount.mul(getRate()).div(getTotalSupply()).add(getFee(amount));

// ✅ EFFICIENT: Break into steps
const rate = getRate();
const step1 = amount.mul(rate);
const totalSupply = getTotalSupply();
const step2 = step1.div(totalSupply);
const fee = getFee(amount);
return step2.add(fee);
```

**✅ Custom Gas Limits for Complex Operations:**
```typescript
// For test cases that perform many operations
const result = await contract.read("complexFunction", [args], 30000000n); // 30M gas
```

### Gas Limit Configuration

The SDK supports custom gas limits for complex contract calls:

```typescript
// In test helpers
read: async (
  functionName: string, 
  args: (string | boolean | Address | bigint)[], 
  gasLimit?: bigint
) => {
  const callParams: any = { to: contractAddr, data };
  if (gasLimit) {
    callParams.gas = gasLimit;
  }
  // ...
}
```

---

## Advanced Debugging and Development Workflow

### Compilation Pipeline Deep Dive

Understanding the compilation process helps debug complex issues:

1. **TypeScript Parsing** → Generates IR (Intermediate Representation)
2. **IR Transformation** → Applies transformer/handler logic  
3. **AssemblyScript Generation** → Creates `.transformed.ts`
4. **WASM Compilation** → Final bytecode for deployment

### Debugging Workflow

#### Step 1: Examine Intermediate Representation
```bash
# Check generated IR
cat __tests__/contracts/your-contract/artifacts/intermediate-representation/json/contract-methods/*.json
```

The IR shows how expressions are parsed and structured:
```json
{
  "kind": "call",
  "target": "add", 
  "receiver": {
    "name": "counter",
    "type": "uint256"
  },
  "args": [...]
}
```

#### Step 2: Verify Transformed AssemblyScript
```bash
# Check generated AssemblyScript
cat __tests__/contracts/your-contract/artifacts/contract.transformed.ts
```

Look for:
- Proper import statements
- Correct method transformations
- Storage helper functions

#### Step 3: Test Compilation Step by Step
```bash
# From SDK root
npm run pre:build

# Navigate to contract directory
cd __tests__/contracts/your-contract

# Compile to WASM
npx as-stylus compile contract.ts

# Validate with Stylus
cargo stylus check --endpoint <RPC_URL>
```

### Advanced Handler Development

#### Creating Custom Handlers

When adding support for new types or operations:

1. **Define Type Mappings** in `cli/types/method-types.ts`:
```typescript
export const TYPE_METHOD_RETURNS = {
  [AbiType.YourType]: {
    [MethodName.YourMethod]: AbiType.ReturnType,
  }
};
```

2. **Create Handler Class**:
```typescript
export class YourTypeHandler implements ExpressionHandler {
  canHandle(expr: IRExpression): boolean {
    // Modern approach: check receiver type
    if (expr.receiver && expr.receiver.type === AbiType.YourType) {
      return expr.target === MethodName.YourMethod;
    }
    
    // Legacy fallback: string matching
    return expr.target?.endsWith('.yourMethod') || false;
  }

  handle(expr: any, context: EmitContext, emitExprFn: Function): EmitResult {
    // Transform logic here
    return {
      setupLines: [],
      valueExpr: `YourType.yourMethod(${args})`,
      valueType: "YourType"
    };
  }
}
```

3. **Register in Transformer**:
```typescript
class YourTypeTransformer extends BaseTypeTransformer {
  constructor() {
    super("YourType");
    this.registerHandler(new YourTypeHandler());
  }
}
```

#### Handler Priority and Resolution

Handlers are resolved in order:
1. **Modern handlers** (receiver-based) get priority
2. **Legacy handlers** (string-based) as fallback  
3. **Type-specific** transformers before generic ones
4. **Registration order** within the same transformer

### Memory Management Best Practices

#### Understanding AS-Stylus Memory Model

- **Stack allocation** for simple types (booleans, small integers)
- **Heap allocation** for complex types (U256, Address, String, Struct)
- **Manual management** required for temporary objects
- **Storage operations** use deterministic slot calculation

#### Memory-Efficient Patterns

**✅ Reuse Objects When Possible:**
```typescript
// ✅ GOOD: Reuse existing U256
const result = existingValue.add(amount);

// ❌ AVOID: Creating unnecessary intermediates  
const temp = U256Factory.create();
const result = temp.add(existingValue).add(amount);
```

**✅ Use copyInPlace for Buffer Operations:**
```typescript
// For events and errors that need buffer copying
U256.copyInPlace(destBuffer, srcU256);  // Efficient
// vs
const copy = U256.copy(srcU256);        // Creates new object
```

---

## Contract Patterns and Best Practices

### Nested Function Calls

The SDK supports complex nested function calls and method chaining:

```typescript
// ✅ SUPPORTED: Chained operations
const result = U256Factory.fromString("100")
  .add(counter)
  .mul(multiplier)
  .div(divisor);

// ✅ SUPPORTED: Nested factory calls in loops
while (iterator.lessThan(U256Factory.fromString("10"))) {
  result = result.add(U256Factory.fromString("1"));
  iterator = iterator.add(U256Factory.fromString("1"));
}

// ✅ SUPPORTED: Internal function calls
@Internal
static calculateFee(amount: U256): U256 {
  return amount.mul(U256Factory.fromString("100")).div(U256Factory.fromString("10000"));
}

@External
static processPayment(amount: U256): U256 {
  const fee = calculateFee(amount);  // Internal call works
  return amount.sub(fee);
}
```

### Type System Integration

#### ABI Type Mapping
The SDK automatically maps TypeScript types to ABI types:
- `U256` → `uint256`
- `I256` → `int256`  
- `Address` → `address`
- `Str` → `string`
- `bool` → `bool`
- `Mapping<K,V>` → Complex storage mapping

#### Method Return Type Detection
```typescript
// The system knows calculateFee() returns U256
const fee = calculateFee(amount);  // Type: U256
const isValid = amount.greaterThan(fee);  // Type: bool
const addressOwner = getOwner(tokenId);  // Type: Address
```

### Advanced Contract Features

#### Storage Slot Management
```typescript
// Automatic slot assignment for storage variables
static totalSupply: U256;           // Slot 0
static owner: Address;              // Slot 1  
static balances: Mapping<Address, U256>;  // Slot 2
static allowances: MappingNested<Address, Address, U256>;  // Slot 3
```

#### Event Emission with Type Safety
```typescript
@Event
class Transfer {
  from: Address;
  to: Address;  
  amount: U256;
}

// Emit with automatic ABI encoding
Transfer.emit(fromAddr, toAddr, transferAmount);
```

#### Error Handling Patterns  
```typescript
@Error
class InsufficientBalance {
  required: U256;
  available: U256;
}

// Throw typed errors
if (balance.lessThan(amount)) {
  InsufficientBalance.throw(amount, balance);
}
```

### Testing Guidelines

- Run `npm run pre:build` before any compilation
- Use specific test patterns: `npm test -- --testPathPattern="contract-name"`
- Check artifacts in `__tests__/contracts/*/artifacts/` for debugging
- Verify ABI generation in `abi/contract-abi.json`
- Test inheritance with both parent and child method calls
- Use custom gas limits for complex operations: `contract.read("method", args, 30000000n)`
- Test both happy path and error conditions
- Verify event emission and error throwing in E2E tests