import { createBoolean, fromABI, toABI, notBoolean } from "./wrappers";
import { assertEqual, assertNotEqual, assertByteEqual, assertTrue, assertFalse } from "./helpers";

/**
 * Boolean Tests - Test functions using the Boolean wrappers
 * This file contains all the test logic using the wrapper functions
 */

/**
 * Tests Boolean.create functionality
 * Verifies that true and false pointers are different and contain correct byte values
 * @returns True if test passes, false otherwise
 */
export function testCreate(): bool {
  const truePtr = createBoolean(true);
  const falsePtr = createBoolean(false);
  
  const trueByte = load<u8>(truePtr + 31);
  const falseByte = load<u8>(falsePtr + 31);
  
  assertNotEqual(truePtr, falsePtr, "True and false pointers should be different");
  assertByteEqual(trueByte, 1, "True pointer should contain 1 in last byte");
  assertByteEqual(falseByte, 0, "False pointer should contain 0 in last byte");
  
  return true;
}

/**
 * Tests Boolean.fromABI with primitive values
 * Verifies that fromABI(0) returns false and fromABI(1) returns true
 * @returns True if test passes, false otherwise
 */
export function testFromABIPrimitives(): bool {
  const falseResult = fromABI(0);
  const trueResult = fromABI(1);
  
  assertFalse(falseResult, "fromABI(0) should return false");
  assertTrue(trueResult, "fromABI(1) should return true");
  
  return true;
}

/**
 * Tests Boolean.fromABI with pointer values
 * Verifies that fromABI correctly reads boolean values from memory pointers
 * @returns True if test passes, false otherwise
 */
export function testFromABIPointers(): bool {
  const truePtr = createBoolean(true);
  const falsePtr = createBoolean(false);
  
  const trueResult = fromABI(truePtr);
  const falseResult = fromABI(falsePtr);
  
  assertTrue(trueResult, "fromABI should read true from true pointer");
  assertFalse(falseResult, "fromABI should read false from false pointer");
  
  return true;
}

/**
 * Tests Boolean.toABI with primitive values
 * Verifies that toABI creates valid ABI pointers from primitive values
 * @returns True if test passes, false otherwise
 */
export function testToABIPrimitives(): bool {
  const ptrTrueFromABI = toABI(1);
  const ptrFalseFromABI = toABI(0);
  
  const trueValue = fromABI(ptrTrueFromABI);
  const falseValue = fromABI(ptrFalseFromABI);
  
  assertTrue(trueValue, "toABI(1) should create pointer that reads as true");
  assertFalse(falseValue, "toABI(0) should create pointer that reads as false");
  
  return true;
}

/**
 * Tests Boolean.toABI preserves values when processing existing valid ABI pointers
 * Verifies that toABI maintains consistency with existing ABI data
 * @returns True if test passes, false otherwise
 */
export function testToABIPreservation(): bool {
  const ptrOriginal = createBoolean(true);
  const ptrProcessed = toABI(ptrOriginal);
  
  const originalValue = fromABI(ptrOriginal);
  const processedValue = fromABI(ptrProcessed);
  
  assertEqual(originalValue, processedValue, "Original and processed values should be equal");
  assertTrue(originalValue, "Original value should be true");
  
  return true;
}

/**
 * Tests Boolean.not functionality
 * Verifies boolean negation and double negation behavior
 * @returns True if test passes, false otherwise
 */
export function testNot(): bool {
  const notTrue = notBoolean(true);
  const notFalse = notBoolean(false);
  
  assertFalse(notTrue, "not(true) should be false");
  assertTrue(notFalse, "not(false) should be true");
  
  const doubleNotTrue = notBoolean(notBoolean(true));
  const doubleNotFalse = notBoolean(notBoolean(false));
  
  assertTrue(doubleNotTrue, "not(not(true)) should be true");
  assertFalse(doubleNotFalse, "not(not(false)) should be false");
  
  return true;
}

/**
 * Tests complete round trip: create → toABI → fromABI
 * Verifies that values are preserved through the complete transformation cycle
 * @returns True if test passes, false otherwise
 */
export function testRoundTrip(): bool {
  const ptrOriginal = createBoolean(true);
  const ptrAbi = toABI(ptrOriginal);
  const extractedValue = fromABI(ptrAbi);
  
  assertTrue(extractedValue, "Round trip with true should preserve value");
  
  const ptrOriginalFalse = createBoolean(false);
  const ptrAbiFalse = toABI(ptrOriginalFalse);
  const extractedValueFalse = fromABI(ptrAbiFalse);
  
  assertFalse(extractedValueFalse, "Round trip with false should preserve value");
  
  return true;
}

/**
 * Tests edge cases and boundary conditions
 * Verifies behavior with invalid pointer values (2-256 range)
 * @returns True if test passes, false otherwise
 */
export function testEdgeCases(): bool {
  const result2 = fromABI(2);
  const result255 = fromABI(255);
  const result256 = fromABI(256);
  
  assertFalse(result2, "fromABI(2) should return false from uninitialized memory");
  assertFalse(result255, "fromABI(255) should return false from uninitialized memory");
  assertFalse(result256, "fromABI(256) should return false from uninitialized memory");
  
  return true;
}

/**
 * Tests toABI with edge values
 * Verifies behavior with values like 0, 1, 255 that define primitive vs pointer logic
 * @returns True if test passes, false otherwise
 */
export function testToABIEdgeValues(): bool {
  const ptrLowValue = toABI(255);
  const lowResult = fromABI(ptrLowValue);
  assertFalse(lowResult, "toABI(255) should create false pointer (not equal to 1)");
  
  const ptrOne = toABI(1);
  const oneResult = fromABI(ptrOne);
  assertTrue(oneResult, "toABI(1) should create true pointer");
  
  const ptrZero = toABI(0);
  const zeroResult = fromABI(ptrZero);
  assertFalse(zeroResult, "toABI(0) should create false pointer");
  
  return true;
}

/**
 * Tests fromABI consistency (determinism)
 * Verifies that fromABI is consistent/deterministic for the same inputs
 * @returns True if test passes, false otherwise
 */
export function testFromABIConsistency(): bool {
  const input0 = 0;
  const result0_call1 = fromABI(input0);
  const result0_call2 = fromABI(input0);
  const result0_call3 = fromABI(input0);
  assertEqual(result0_call1, result0_call2, "fromABI(0) should be consistent across calls");
  assertEqual(result0_call2, result0_call3, "fromABI(0) should be consistent across calls");
  assertFalse(result0_call1, "fromABI(0) should consistently return false");
  
  const input1 = 1;
  const result1_call1 = fromABI(input1);
  const result1_call2 = fromABI(input1);
  const result1_call3 = fromABI(input1);
  assertEqual(result1_call1, result1_call2, "fromABI(1) should be consistent across calls");
  assertEqual(result1_call2, result1_call3, "fromABI(1) should be consistent across calls");
  assertTrue(result1_call1, "fromABI(1) should consistently return true");
  
  const input2 = 2;
  const result2_call1 = fromABI(input2);
  const result2_call2 = fromABI(input2);
  const result2_call3 = fromABI(input2);
  assertEqual(result2_call1, result2_call2, "fromABI(2) should be consistent across calls");
  assertEqual(result2_call2, result2_call3, "fromABI(2) should be consistent across calls");
  assertFalse(result2_call1, "fromABI(2) should consistently return false");
  
  const ptrTrue = createBoolean(true);
  const ptrResult1 = fromABI(ptrTrue);
  const ptrResult2 = fromABI(ptrTrue);
  const ptrResult3 = fromABI(ptrTrue);
  assertEqual(ptrResult1, ptrResult2, "fromABI with pointer should be consistent across calls");
  assertEqual(ptrResult2, ptrResult3, "fromABI with pointer should be consistent across calls");
  assertTrue(ptrResult1, "fromABI with true pointer should consistently return true");
  
  return true;
}

/**
 * Tests toABI mathematical idempotence: toABI(toABI(x)) = toABI(x)
 * Verifies idempotence property for toABI operations
 * @returns True if test passes, false otherwise
 */
export function testToABIIdempotence(): bool {
  const ptrStep1_1 = toABI(1);
  const ptrStep1_2 = toABI(ptrStep1_1);
  
  const value1_single = fromABI(ptrStep1_1);
  const value1_double = fromABI(ptrStep1_2);
  assertEqual(value1_single, value1_double, "toABI(toABI(1)) should equal toABI(1)");
  assertTrue(value1_single, "toABI(1) should create true pointer");
  
  const ptrStep0_1 = toABI(0);
  const ptrStep0_2 = toABI(ptrStep0_1);
  
  const value0_single = fromABI(ptrStep0_1);
  const value0_double = fromABI(ptrStep0_2);
  assertEqual(value0_single, value0_double, "toABI(toABI(0)) should equal toABI(0)");
  assertFalse(value0_single, "toABI(0) should create false pointer");
  
  const ptrOriginal = createBoolean(true);
  const ptrOnce = toABI(ptrOriginal);
  const ptrTwice = toABI(ptrOnce);
  const ptrThrice = toABI(ptrTwice);
  
  const valueOriginal = fromABI(ptrOriginal);
  const valueOnce = fromABI(ptrOnce);
  const valueTwice = fromABI(ptrTwice);
  const valueThrice = fromABI(ptrThrice);
  
  assertEqual(valueOriginal, valueOnce, "Original and once-processed should be equal");
  assertEqual(valueOnce, valueTwice, "Once and twice-processed should be equal");
  assertEqual(valueTwice, valueThrice, "Twice and thrice-processed should be equal");
  assertTrue(valueOriginal, "All processed values should be true");
  
  let ptrCurrent = createBoolean(false);
  for (let i = 0; i < 5; i++) {
    ptrCurrent = toABI(ptrCurrent);
  }
  const finalValue = fromABI(ptrCurrent);
  assertFalse(finalValue, "Multiple toABI applications should preserve false value");
  
  return true;
}

/**
 * Tests chain operations: create → toABI → fromABI → toABI → fromABI
 * Verifies data integrity through complex functional composition
 * @returns True if test passes, false otherwise
 */
export function testChainOperations(): bool {
  const ptrOriginal = createBoolean(true);
  
  const ptrStep1 = toABI(ptrOriginal);
  const step2 = fromABI(ptrStep1);
  const ptrStep3 = toABI(step2 ? 1 : 0);
  const step4 = fromABI(ptrStep3);
  const ptrStep5 = toABI(step4 ? 1 : 0);
  const finalValue = fromABI(ptrStep5);
  
  assertTrue(finalValue, "Chain operations with true should preserve value");
  
  const ptrOriginalFalse = createBoolean(false);
  const ptrStepF1 = toABI(ptrOriginalFalse);
  const stepF2 = fromABI(ptrStepF1);
  const ptrStepF3 = toABI(stepF2 ? 1 : 0);
  const stepF4 = fromABI(ptrStepF3);
  const ptrStepF5 = toABI(stepF4 ? 1 : 0);
  const finalValueFalse = fromABI(ptrStepF5);
  
  assertFalse(finalValueFalse, "Chain operations with false should preserve value");
  
  return true;
}

/**
 * Tests deterministic behavior under repeated operations
 * Verifies mathematical stability across multiple nested operations
 * @returns True if test passes, false otherwise
 */
export function testRepeatedOperations(): bool {
  let currentValue: bool = true;
  
  for (let i = 0; i < 10; i++) {
    const primitiveValue: usize = currentValue ? 1 : 0;
    currentValue = fromABI(primitiveValue);
  }
  
  assertTrue(currentValue, "Repeated fromABI operations should preserve true value");
  
  let ptrCurrent = createBoolean(false);
  
  for (let i = 0; i < 5; i++) {
    ptrCurrent = toABI(ptrCurrent);
  }
  
  const finalValue = fromABI(ptrCurrent);
  assertFalse(finalValue, "Repeated toABI operations should preserve false value");
  
  return true;
}

/**
 * Comprehensive integration test
 * Validates all Boolean methods working together with correct mathematical properties
 * @returns True if all tests pass, false otherwise
 */
export function testComprehensive(): bool {
  if (!testCreate()) return false;
  
  if (!testFromABIPrimitives()) return false;
  if (!testFromABIPointers()) return false;
  
  if (!testToABIPrimitives()) return false;
  if (!testToABIPreservation()) return false;
  
  if (!testNot()) return false;
  
  if (!testRoundTrip()) return false;
  
  if (!testEdgeCases()) return false;
  if (!testToABIEdgeValues()) return false;
  
  if (!testFromABIConsistency()) return false;
  if (!testToABIIdempotence()) return false;
  if (!testChainOperations()) return false;
  if (!testRepeatedOperations()) return false;
  
  return true;
}