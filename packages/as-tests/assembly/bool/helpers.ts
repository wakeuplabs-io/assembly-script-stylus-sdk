/**
 * Test assertion helpers for Boolean testing
 * Provides assertion functions that throw on failure for cleaner test code
 */

/**
 * Asserts that two boolean values are equal
 * @param actual - The actual boolean value
 * @param expected - The expected boolean value
 * @param message - Optional error message
 * @throws Error if assertion fails
 */
export function assertEqual(actual: bool, expected: bool, message: string = "Values are not equal"): void {
  if (actual != expected) {
    throw new Error(message + ` (expected: ${expected}, actual: ${actual})`);
  }
}

/**
 * Asserts that two usize values are not equal (for pointer comparison)
 * @param actual - The actual usize value
 * @param expected - The value that should not be equal
 * @param message - Optional error message
 * @throws Error if assertion fails
 */
export function assertNotEqual(actual: usize, expected: usize, message: string = "Values should not be equal"): void {
  if (actual == expected) {
    throw new Error(message + ` (both values: ${actual})`);
  }
}

/**
 * Asserts that a u8 value equals expected value
 * @param actual - The actual u8 value
 * @param expected - The expected u8 value
 * @param message - Optional error message
 * @throws Error if assertion fails
 */
export function assertByteEqual(actual: u8, expected: u8, message: string = "Byte values are not equal"): void {
  if (actual != expected) {
    throw new Error(message + ` (expected: ${expected}, actual: ${actual})`);
  }
}

/**
 * Asserts that a boolean value is true
 * @param actual - The boolean value to check
 * @param message - Optional error message
 * @throws Error if assertion fails
 */
export function assertTrue(actual: bool, message: string = "Expected value to be true"): void {
  if (!actual) {
    throw new Error(message);
  }
}

/**
 * Asserts that a boolean value is false
 * @param actual - The boolean value to check
 * @param message - Optional error message
 * @throws Error if assertion fails
 */
export function assertFalse(actual: bool, message: string = "Expected value to be false"): void {
  if (actual) {
    throw new Error(message);
  }
}