import { Boolean } from "../../../as-stylus/core/types/boolean";

/**
 * Boolean Wrappers - Direct wrappers for Boolean class methods only
 * This file contains ONLY wrappers for the Boolean class methods from as-stylus SDK
 * No test logic here - just clean wrappers for the core functionality
 */

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