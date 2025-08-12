import { AbiType } from "./abi.types.js";

/**
 * **Method Type Definitions and Utilities**
 *
 * This module provides type-safe method name definitions, return type mappings,
 * and utility functions for method classification across different blockchain types.
 * It centralizes method metadata to support accurate type inference and validation
 * in the IR transformation pipeline.
 *
 * **Key Features:**
 * - **Type-Safe Method Names**: Enum-based method definitions
 * - **Return Type Mapping**: Automatic type inference for method calls
 * - **Method Grouping**: Logical categorization of related operations
 * - **Cross-Type Support**: Unified interface for U256, I256, Address, String, etc.
 *
 * @example
 * ```typescript
 * // Type-safe method detection
 * if (isMethodInGroup(methodName, "ARITHMETIC")) {
 *   // Handle arithmetic operations (add, sub, mul, etc.)
 * }
 *
 * // Automatic return type inference
 * const returnType = getMethodReturnType(AbiType.Uint256, "lessThan"); // AbiType.Bool
 * ```
 */

/**
 * **Standardized Method Names**
 *
 * Enumeration of all supported method names across different blockchain types.
 * These names are used for consistent method detection and transformation across
 * the entire compilation pipeline.
 *
 * **Categories:**
 * - **Comparison**: `lessThan`, `greaterThan`, `equals`, etc.
 * - **String/Display**: `toString`, `length`, `slice`, etc.
 * - **Arithmetic**: `add`, `sub`, `mul`, `div`, `mod`, `pow`, `abs`
 * - **Type-Specific**: `isZero`, `hasCode`, `isNegative`, etc.
 * - **Factory**: `fromString`, `create`, etc.
 */
export enum MethodName {
  // Comparison methods
  LessThan = "lessThan",
  GreaterThan = "greaterThan",
  Equals = "equals",
  LessThanOrEqual = "lessThanOrEqual",
  GreaterThanOrEqual = "greaterThanOrEqual",
  NotEqual = "notEqual",

  // String/Display methods
  ToString = "toString",

  // U256/I256 specific methods
  Add = "add",
  Sub = "sub",
  Mul = "mul",
  Div = "div",
  Mod = "mod",
  Pow = "pow",
  Abs = "abs",

  // Address methods
  IsZero = "isZero",
  HasCode = "hasCode",

  // String methods
  Length = "length",
  Slice = "slice",

  // Mapping methods
  Get = "get",
  Set = "set",

  // Factory methods
  FromString = "fromString",
  Create = "create",

  // Special methods
  IsEmpty = "isEmpty",
}

/**
 * **Method Groupings for Logical Classification**
 *
 * Predefined groups of related methods for easy categorization and handling.
 * These groups help transformers identify the type of operation being performed
 * and apply appropriate transformation logic.
 *
 * **Usage:**
 * - **Type Inference**: Determine expected return types
 * - **Validation**: Ensure methods are valid for specific types
 * - **Code Generation**: Apply group-specific transformation patterns
 */
export const METHOD_GROUPS = {
  COMPARISON: [
    MethodName.LessThan,
    MethodName.GreaterThan,
    MethodName.Equals,
    MethodName.LessThanOrEqual,
    MethodName.GreaterThanOrEqual,
    MethodName.NotEqual,
  ] as const,

  ARITHMETIC: [
    MethodName.Add,
    MethodName.Sub,
    MethodName.Mul,
    MethodName.Div,
    MethodName.Mod,
    MethodName.Pow,
  ] as const,

  STRING_CONVERSION: [MethodName.ToString] as const,

  BOOLEAN_CHECKS: [MethodName.IsZero, MethodName.HasCode, MethodName.IsEmpty] as const,

  FACTORY: [MethodName.FromString, MethodName.Create] as const,
} as const;

/**
 * **Type-Specific Method Return Type Mappings**
 *
 * Comprehensive mapping of methods to their return types for each supported AbiType.
 * This enables automatic type inference during IR transformation, ensuring that
 * method calls generate correct AssemblyScript code with proper type annotations.
 *
 * **Structure**: `[AbiType][MethodName] -> ReturnType`
 *
 * **Key Patterns:**
 * - **Comparison methods** → `AbiType.Bool`
 * - **Arithmetic methods** → Same type as receiver (U256→U256, I256→I256)
 * - **String conversion** → `AbiType.String`
 * - **Type conversions** → Target type (I256.abs()→U256)
 *
 * @example
 * ```typescript
 * // U256 arithmetic returns U256
 * TYPE_METHOD_RETURNS[AbiType.Uint256][MethodName.Add] === AbiType.Uint256
 *
 * // I256 absolute value returns U256 (always positive)
 * TYPE_METHOD_RETURNS[AbiType.Int256][MethodName.Abs] === AbiType.Uint256
 *
 * // All comparison methods return boolean
 * TYPE_METHOD_RETURNS[AbiType.Uint256][MethodName.LessThan] === AbiType.Bool
 * ```
 */
export const TYPE_METHOD_RETURNS = {
  [AbiType.Uint256]: {
    [MethodName.LessThan]: AbiType.Bool,
    [MethodName.GreaterThan]: AbiType.Bool,
    [MethodName.Equals]: AbiType.Bool,
    [MethodName.LessThanOrEqual]: AbiType.Bool,
    [MethodName.GreaterThanOrEqual]: AbiType.Bool,
    [MethodName.NotEqual]: AbiType.Bool,
    [MethodName.ToString]: AbiType.String,
    [MethodName.Add]: AbiType.Uint256,
    [MethodName.Sub]: AbiType.Uint256,
    [MethodName.Mul]: AbiType.Uint256,
    [MethodName.Div]: AbiType.Uint256,
    [MethodName.Mod]: AbiType.Uint256,
    [MethodName.Pow]: AbiType.Uint256,
    [MethodName.IsZero]: AbiType.Bool,
  },

  [AbiType.Int256]: {
    [MethodName.LessThan]: AbiType.Bool,
    [MethodName.GreaterThan]: AbiType.Bool,
    [MethodName.Equals]: AbiType.Bool,
    [MethodName.LessThanOrEqual]: AbiType.Bool,
    [MethodName.GreaterThanOrEqual]: AbiType.Bool,
    [MethodName.NotEqual]: AbiType.Bool,
    [MethodName.ToString]: AbiType.String,
    [MethodName.Add]: AbiType.Int256,
    [MethodName.Sub]: AbiType.Int256,
    [MethodName.Mul]: AbiType.Int256,
    [MethodName.Div]: AbiType.Int256,
    [MethodName.Mod]: AbiType.Int256,
    [MethodName.Pow]: AbiType.Int256,
    [MethodName.Abs]: AbiType.Uint256, // abs returns positive value
    [MethodName.IsZero]: AbiType.Bool,
  },

  [AbiType.Address]: {
    [MethodName.IsZero]: AbiType.Bool,
    [MethodName.ToString]: AbiType.String,
    [MethodName.Equals]: AbiType.Bool,
    [MethodName.HasCode]: AbiType.Bool,
  },

  [AbiType.String]: {
    [MethodName.Length]: AbiType.Uint256,
    [MethodName.Slice]: AbiType.String,
    [MethodName.ToString]: AbiType.String,
    [MethodName.Equals]: AbiType.Bool,
    [MethodName.IsEmpty]: AbiType.Bool,
  },

  [AbiType.Mapping]: {
    [MethodName.Get]: AbiType.Address, // Default assumption - should be parameterized
    [MethodName.Set]: AbiType.Void,
  },

  [AbiType.Function]: {
    [MethodName.FromString]: AbiType.Uint256, // Default for U256Factory.fromString
    [MethodName.Create]: AbiType.Uint256, // Default for U256Factory.create
  },
} as const;

/**
 * Helper type to get method return type
 */
export type MethodReturnType<
  T extends AbiType,
  M extends MethodName,
> = T extends keyof typeof TYPE_METHOD_RETURNS
  ? M extends keyof (typeof TYPE_METHOD_RETURNS)[T]
    ? (typeof TYPE_METHOD_RETURNS)[T][M]
    : AbiType.Unknown
  : AbiType.Unknown;

/**
 * Checks if a method belongs to a specific logical group.
 *
 * @param method - The method name to check
 * @param group - The method group to check against
 * @returns `true` if the method belongs to the specified group
 *
 * @example
 * ```typescript
 * isMethodInGroup("add", "ARITHMETIC");        // true
 * isMethodInGroup("lessThan", "COMPARISON");   // true
 * isMethodInGroup("toString", "ARITHMETIC");   // false
 * ```
 */
export function isMethodInGroup(method: string, group: keyof typeof METHOD_GROUPS): boolean {
  const groupMethods = METHOD_GROUPS[group] as readonly string[];
  return groupMethods.includes(method);
}

/**
 * Determines the return type for a method call on a specific receiver type.
 *
 * This function enables automatic type inference during IR transformation by
 * providing the expected return type for any method call based on the receiver
 * type and method name.
 *
 * @param receiverType - The ABI type of the receiver object
 * @param methodName - The name of the method being called
 * @returns The ABI type that the method call should return
 *
 * @example
 * ```typescript
 * // Arithmetic operations return the same type as receiver
 * getMethodReturnType(AbiType.Uint256, "add");      // AbiType.Uint256
 * getMethodReturnType(AbiType.Int256, "sub");       // AbiType.Int256
 *
 * // Comparison operations always return boolean
 * getMethodReturnType(AbiType.Uint256, "lessThan"); // AbiType.Bool
 *
 * // Special cases: I256.abs() returns U256 (positive)
 * getMethodReturnType(AbiType.Int256, "abs");       // AbiType.Uint256
 * ```
 */
export function getMethodReturnType(receiverType: AbiType, methodName: string): AbiType {
  const typeMapping = TYPE_METHOD_RETURNS[receiverType as keyof typeof TYPE_METHOD_RETURNS];
  if (!typeMapping) {
    return receiverType;
  }

  const returnType = typeMapping[methodName as keyof typeof typeMapping];
  return returnType || receiverType;
}

/**
 * Type guard that validates if a string represents a known method name.
 *
 * @param method - The string to validate
 * @returns `true` if the string is a valid MethodName enum value
 *
 * @example
 * ```typescript
 * isValidMethodName("add");        // true
 * isValidMethodName("lessThan");   // true
 * isValidMethodName("invalid");    // false
 * ```
 */
export function isValidMethodName(method: string): method is MethodName {
  return Object.values(MethodName).includes(method as MethodName);
}
