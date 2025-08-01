/**
 * Constants used throughout the expression transformation system
 */

export const RELATIONAL_OPERATORS = ["<", ">", "<=", ">=", "==", "!="] as const;
export type RelationalOperator = typeof RELATIONAL_OPERATORS[number];

export const LOGICAL_OPERATORS = ["&&", "||", "!"] as const;
export type LogicalOperator = typeof LOGICAL_OPERATORS[number];

export const ARITHMETIC_OPERATORS = ["+", "-", "*", "/", "%", "**"] as const;
export type ArithmeticOperator = typeof ARITHMETIC_OPERATORS[number];

export const ASSIGNMENT_OPERATORS = ["=", "+=", "-=", "*=", "/=", "%="] as const;
export type AssignmentOperator = typeof ASSIGNMENT_OPERATORS[number];

/**
 * Mapping methods for different value types
 */
export const MAPPING_METHODS = {
  U256: {
    get: "getU256",
    set: "setU256"
  },
  Address: {
    get: "getAddress", 
    set: "setAddress"
  },
  Boolean: {
    get: "getBoolean",
    set: "setBoolean"
  },
  String: {
    get: "getString",
    set: "setString"
  }
} as const;

/**
 * Nested mapping methods
 */
export const NESTED_MAPPING_METHODS = {
  U256: {
    get: "getU256",
    set: "setU256"
  },
  boolean: {
    get: "getBoolean",
    set: "setBoolean"
  }
} as const;

/**
 * Comparison method mappings for U256/I256 types
 */
export const COMPARISON_METHODS = {
  "<": "lessThan",
  ">": "greaterThan",
  "==": "equals",
  "!=": "notEquals",
  "<=": "lessThanOrEqual",
  ">=": "greaterThanOrEqual"
} as const;

/**
 * Type class mappings
 */
const _TYPE_CLASSES = {
  "int256": "I256",
  "uint256": "U256",
  "boolean": "Boolean",
  "string": "Str",
  "address": "Address",
  "msg": "Msg"
} as const;

/**
 * Boolean wrapper methods
 */
export const BOOLEAN_METHODS = {
  create: "Boolean.create",
  fromABI: "Boolean.fromABI",
  not: "Boolean.not"
} as const;