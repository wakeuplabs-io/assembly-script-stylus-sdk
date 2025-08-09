import { 
  add,
  testCreate,
  testFromABIPrimitives,
  testFromABIPointers,
  testToABIPrimitives,
  testToABIPreservation,
  testNot,
  testRoundTrip,
  testEdgeCases,
  testToABIEdgeValues,
  testFromABIConsistency,
  testToABIIdempotence,
  testChainOperations,
  testRepeatedOperations,
  testComprehensive
} from "../build/debug.js";

import { 
  test, 
  describe, 
  printHeader, 
  printFinalStats 
} from "./test-framework.js";

// Print professional header
printHeader(
  "Boolean Core Class Testing Suite",
  "Testing Boolean class from as-stylus SDK with mathematical rigor"
);

// Module verification
describe("Module Verification", (results) => {
  results.push(test(
    "WASM module loads successfully and basic arithmetic functions work correctly",
    () => add(1, 2) === 3
  ));
});

// Core functionality tests
describe("Core Boolean Functionality", (results) => {
  results.push(test(
    "Boolean.create creates valid ABI-compatible pointers with correct 32-byte memory structure (true=1, false=0 in last byte)",
    testCreate
  ));

  results.push(test(
    "Boolean.fromABI correctly handles primitive values (fromABI(0) returns false, fromABI(1) returns true)",
    testFromABIPrimitives
  ));

  results.push(test(
    "Boolean.fromABI correctly reads boolean values from memory pointers (true from true pointer, false from false pointer)",
    testFromABIPointers
  ));

  results.push(test(
    "Boolean.toABI converts primitive values to ABI format (toABI(1) creates true pointer, toABI(0) creates false pointer)", 
    testToABIPrimitives
  ));

  results.push(test(
    "Boolean.toABI preserves values when processing existing valid ABI pointers",
    testToABIPreservation
  ));

  results.push(test(
    "Boolean.not provides correct boolean negation (not(true)=false, not(false)=true, double negation works)",
    testNot
  ));
});

// Mathematical properties tests  
describe("Mathematical Properties", (results) => {
  results.push(test(
    "Boolean.fromABI demonstrates mathematical determinism (NOT idempotence due to type mismatch usize→bool, but consistent same input→same output)",
    testFromABIConsistency
  ));

  results.push(test(
    "Boolean.toABI demonstrates true mathematical idempotence (toABI(toABI(x)) = toABI(x), satisfying f(f(x)) = f(x) for usize→usize)",
    testToABIIdempotence
  ));
});

// Edge cases and boundary testing
describe("Edge Cases & Boundary Conditions", (results) => {
  results.push(test(
    "Round trip operations preserve boolean values correctly (create(true)→toABI→fromABI=true, create(false)→toABI→fromABI=false)",
    testRoundTrip
  ));

  results.push(test(
    "Edge cases handle invalid pointer values correctly (values 2-256 treated as pointers, return false from uninitialized memory)",
    testEdgeCases
  ));

  results.push(test(
    "toABI boundary behavior handles primitive vs pointer distinction (values <256 as primitives, only value 1 creates true ABI, 0&255 create false)",
    testToABIEdgeValues
  ));
});

// Stress testing and complex operations
describe("Stress Testing & Complex Operations", (results) => {
  results.push(test(
    "Chain operations maintain data integrity through complex functional composition (create→toABI→fromABI→toABI→fromABI→toABI preserves values)",
    testChainOperations
  ));

  results.push(test(
    "Repeated operations demonstrate mathematical stability (fromABI determinism across 10 calls, toABI idempotence across 5 nested applications)",
    testRepeatedOperations
  ));
});

// Integration test
describe("Integration Testing", (results) => {
  results.push(test(
    "Comprehensive integration test validates all Boolean methods working together with correct mathematical properties verified",
    testComprehensive
  ));
});

// Print final statistics and results
printFinalStats();

