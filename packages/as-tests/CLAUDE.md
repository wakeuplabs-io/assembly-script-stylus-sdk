# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the AS-Tests package.

## Project Overview

AS-Tests - A comprehensive testing framework for AssemblyScript-based Boolean operations in the AS-Stylus SDK. This package provides rigorous testing of Boolean class methods with mathematical precision, focusing on idempotence, determinism, and ABI compatibility for Arbitrum Stylus contracts.

## Common Commands

### Testing
- `npm test` - Run all Boolean tests (compile to WASM + execute test suite)
- `npm run asbuild:debug` - Compile AssemblyScript to debug WASM
- `npm run asbuild:release` - Compile AssemblyScript to optimized WASM
- `node tests` - Run test suite against compiled WASM

### Development
- `npm run clean` - Clean build artifacts
- Check `package.json` for additional scripts

## Architecture

### Core Structure

```
assembly/
├── index.ts              # WASM entry point and exports
├── boolean/              # Boolean testing module
│   ├── wrappers.ts      # Clean function wrappers for Boolean class methods
│   ├── tests.ts         # Test functions using wrapper functions
│   └── helpers.ts       # Assertion helpers with throw-based failures
tests/
├── index.js             # Main test runner using test framework
└── test-framework.js    # Jest/Mocha-style test framework
```

### Boolean Testing Module (`assembly/boolean/`)

#### **Wrappers (`wrappers.ts`)**
Clean, direct wrappers for Boolean class methods from AS-Stylus SDK:

```typescript
/**
 * Creates a new Boolean instance with specified value
 * @param value - The boolean value to store (defaults to false)
 * @returns Pointer to the newly allocated 32-byte boolean
 */
export function createBoolean(value: bool = false): usize {
  return Boolean.create(value);
}

/**
 * Extracts boolean value from ABI-encoded data
 * @param pointer - Pointer to 32-byte ABI data or primitive boolean value
 * @returns The decoded boolean value
 */
export function fromABI(pointer: usize): bool {
  return Boolean.fromABI(pointer);
}

/**
 * Converts value to ABI-compatible format
 * @param value - Value to convert to ABI format
 * @returns Pointer to ABI-encoded boolean data
 */
export function toABI(value: usize): usize {
  return Boolean.toABI(value);
}

/**
 * Negates a boolean value
 * @param value - The boolean value to negate
 * @returns The negated boolean value
 */
export function notBoolean(value: bool): bool {
  return Boolean.not(value);
}
```

#### **Test Functions (`tests.ts`)**
Comprehensive test functions using positive assertions:

**Available Test Functions:**
- `testCreate()` - Tests Boolean.create functionality
- `testFromABIPrimitives()` - Tests fromABI with primitive values (0, 1)
- `testFromABIPointers()` - Tests fromABI with memory pointers
- `testToABIPrimitives()` - Tests toABI with primitive values
- `testToABIPreservation()` - Tests toABI with existing ABI pointers
- `testNot()` - Tests boolean negation and double negation
- `testRoundTrip()` - Tests complete create → toABI → fromABI cycles
- `testEdgeCases()` - Tests behavior with invalid pointer values (2-256)
- `testToABIEdgeValues()` - Tests primitive vs pointer distinction (0, 1, 255)
- `testFromABIConsistency()` - Tests deterministic behavior (same input → same output)
- `testToABIIdempotence()` - Tests mathematical idempotence: toABI(toABI(x)) = toABI(x)
- `testChainOperations()` - Tests complex functional composition
- `testRepeatedOperations()` - Tests stability under repeated operations
- `testComprehensive()` - Integration test running all individual tests

#### **Assertion Helpers (`helpers.ts`)**
Modern throw-based assertions for clean test code:

```typescript
export function assertEqual(actual: bool, expected: bool, message: string): void
export function assertNotEqual(actual: usize, expected: usize, message: string): void  
export function assertByteEqual(actual: u8, expected: u8, message: string): void
export function assertTrue(actual: bool, message: string): void
export function assertFalse(actual: bool, message: string): void
```

**Key Pattern:**
- All assertions throw `Error` on failure with descriptive messages
- Test functions only need `return true;` at the end if all assertions pass
- Throws are caught by test framework and reported as "CRASHED" with error details

### Test Framework (`tests/`)

#### **Professional Test Runner (`test-framework.js`)**
Jest/Mocha-style framework with:

```javascript
function test(description, testFunction)    // Run individual test
function describe(suiteName, testSuite)     // Group tests into suites  
function printHeader(title, subtitle)      // Print test session header
function printFinalStats()                 // Print comprehensive results
```

**Features:**
- ✅/❌ Visual indicators for pass/fail
- 💥 Crash detection with error messages and stack traces
- 📊 Suite-level and overall statistics
- 🎉 Final verdict with success rates

#### **Test Suite Organization (`index.js`)**
Tests organized into logical suites:

1. **Module Verification** - WASM loading and basic functionality
2. **Core Boolean Functionality** - Individual method testing
3. **Mathematical Properties** - Idempotence and determinism validation
4. **Edge Cases & Boundary Conditions** - Boundary value and error condition testing
5. **Stress Testing & Complex Operations** - Chain operations and repeated applications
6. **Integration Testing** - Comprehensive end-to-end validation

### Key Testing Concepts

#### **Mathematical Rigor**

**Idempotence vs Determinism:**
- **Idempotence**: `f(f(x)) = f(x)` - toABI exhibits true mathematical idempotence
- **Determinism**: Same input always produces same output - fromABI is deterministic but NOT idempotent (type mismatch: usize → bool)

**ABI Compatibility:**
- 32-byte memory layout for boolean storage
- Last byte contains 0 (false) or 1 (true)
- Primitive vs pointer distinction at value 256 boundary

#### **Variable Naming Conventions**
- `ptr*` prefix for variables containing memory pointers
- `*Result` suffix for variables containing boolean results from fromABI()
- Clear distinction between pointers and primitive values

#### **Test Patterns**

**✅ Positive Assertions (Modern Style):**
```typescript
export function testExample(): bool {
  const result = fromABI(1);
  
  assertTrue(result, "fromABI(1) should return true");
  // More assertions...
  
  return true; // Only reached if all assertions pass
}
```

**❌ Avoid Negative Patterns:**
```typescript
// DON'T do this (counter-intuitive)
if (result != true) return false;
if (otherResult != false) return false;
```

### Best Practices

#### **Test Development**
✅ **Use descriptive assertion messages** - Explain what should happen
✅ **Test mathematical properties** - Verify idempotence, determinism, consistency  
✅ **Test edge cases** - Boundary values, error conditions, memory limits
✅ **Use positive assertions** - Say what SHOULD be true, not what shouldn't
✅ **Follow naming conventions** - `ptr*` for pointers, clear variable names
✅ **One assertion per concept** - Don't combine unrelated checks

#### **Code Organization**
✅ **Separation of concerns** - Wrappers, tests, and helpers in separate files
✅ **JSDoc documentation** - All functions fully documented
✅ **No inline comments** - Use JSDoc only, keep code clean
✅ **Consistent exports** - Export individual functions, not classes

### Mathematical Validation

#### **Boolean.toABI Properties**
- **Idempotent**: `toABI(toABI(x)) = toABI(x)` ✅
- **Boundary behavior**: Values < 256 treated as primitives, ≥ 256 as pointers
- **Primitive logic**: Only `toABI(1)` creates true pointer, others create false

#### **Boolean.fromABI Properties**  
- **Deterministic**: Same input always gives same output ✅
- **NOT Idempotent**: Type mismatch (usize → bool) prevents mathematical idempotence
- **Consistency**: Multiple calls with same input produce identical results

#### **Boolean.create Properties**
- **Memory layout**: 32-byte allocation with value in last byte
- **Pointer uniqueness**: Different boolean values create different pointers
- **ABI compatibility**: Compatible with toABI/fromABI roundtrips

### Common Issues and Solutions

#### **AssemblyScript Compilation**
- **Type mismatches**: Use `bool` not `boolean` for AssemblyScript functions
- **Memory management**: Tests automatically handle heap initialization
- **Export requirements**: Functions must be exported to be callable from JavaScript

#### **Test Framework Integration**
- **Crash detection**: Thrown errors caught and reported with descriptive messages
- **Build process**: Always run `npm run asbuild:debug` before `node tests`
- **Import/export sync**: Ensure all test functions are exported from both AssemblyScript and JavaScript

#### **Mathematical Correctness**
- **Idempotence testing**: Only apply to functions where input/output types match
- **Determinism validation**: Test multiple calls with same input for consistency
- **Edge case coverage**: Test boundary values where behavior changes

### Dependencies

- **AssemblyScript** - Core compilation from TypeScript to WASM
- **AS-Stylus SDK** - Boolean class and core type implementations  
- **Node.js** - Test runner execution environment

---

This testing framework demonstrates rigorous mathematical validation of Boolean operations with modern assertion patterns, comprehensive edge case coverage, and professional test organization suitable for production smart contract development.