import { SyntaxKind } from "ts-morph";

import { AbiType } from "./abi.types.js";

/**
 * **Receiver Type Classification System**
 *
 * This module provides type-safe classification and processing utilities for
 * different types of receivers in chained method calls. It enables the IR builder
 * to correctly identify and handle complex expression patterns like factory
 * method chains and property access chains.
 *
 * **Key Concepts:**
 * - **Receiver**: The object/expression that a method is called on
 * - **Chained Calls**: Method calls where the receiver is itself a call expression
 * - **Type Safety**: Prevents incorrect chaining detection that could interfere with other transformers
 *
 * @example
 * ```typescript
 * // Different receiver types:
 * U256Factory.fromString("2").add(counter)  // CALL receiver (chainable)
 * owners.get(tokenId)                       // IDENTIFIER receiver (not chainable)
 * obj.prop.method()                         // PROPERTY receiver (context-dependent)
 * ```
 */

/**
 * **Receiver Type Categories**
 *
 * Enumeration of different receiver patterns found in chained method calls.
 * Each type has different chaining rules and processing requirements.
 */
export enum ReceiverType {
  /** Method call as receiver - e.g., `U256Factory.fromString("2").add(...)` */
  CALL = "call",
  /** Property access as receiver - e.g., `obj.prop.method(...)` */
  PROPERTY = "property",
  /** Simple identifier as receiver - e.g., `variable.method(...)` */
  IDENTIFIER = "identifier",
}

/**
 * **Receiver Classification Metadata**
 *
 * Contains classification information and processing rules for different
 * types of receivers in method call expressions.
 *
 * @interface ReceiverInfo
 * @property type - The logical category of the receiver
 * @property syntaxKind - The TypeScript AST node type
 * @property isChainable - Whether this receiver type supports method chaining
 * @property expectedReturnType - Optional expected return type for validation
 */
export interface ReceiverInfo {
  type: ReceiverType;
  syntaxKind: SyntaxKind;
  isChainable: boolean;
  expectedReturnType?: AbiType;
}

/**
 * **Receiver Type Classification Map**
 *
 * Maps TypeScript AST SyntaxKind values to their corresponding receiver information.
 * This mapping is used by the chained call analyzer to determine how to process
 * different types of receiver expressions.
 *
 * **Key Design Decisions:**
 * - `CallExpression` is chainable - enables factory method chains like `U256Factory.fromString().add()`
 * - `Identifier` is NOT chainable - prevents interference with mapping calls like `owners.get()`
 * - `PropertyAccess` is NOT chainable - these are typically part of larger call expressions
 *
 * **Critical for Type Safety:**
 * The `isChainable: false` setting for `Identifier` prevents the chained call analyzer
 * from incorrectly intercepting simple mapping access patterns, ensuring they are
 * handled by the appropriate specialized transformers.
 *
 * @example
 * ```typescript
 * // This will be chainable (CallExpression receiver):
 * U256Factory.fromString("100").add(counter)
 *
 * // This will NOT be chainable (Identifier receiver):
 * owners.get(tokenId)  // Handled by MappingTransformer instead
 * ```
 */
export const RECEIVER_TYPE_MAP: Partial<Record<SyntaxKind, ReceiverInfo>> = {
  [SyntaxKind.CallExpression]: {
    type: ReceiverType.CALL,
    syntaxKind: SyntaxKind.CallExpression,
    isChainable: true,
    expectedReturnType: AbiType.Function,
  },
  [SyntaxKind.PropertyAccessExpression]: {
    type: ReceiverType.PROPERTY,
    syntaxKind: SyntaxKind.PropertyAccessExpression,
    isChainable: false,
  },
  [SyntaxKind.Identifier]: {
    type: ReceiverType.IDENTIFIER,
    syntaxKind: SyntaxKind.Identifier,
    isChainable: false,
  },
};

/**
 * Determines if a SyntaxKind represents a chainable receiver type.
 *
 * @param kind - The TypeScript AST SyntaxKind to check
 * @returns `true` if the syntax kind supports method chaining
 *
 * @example
 * ```typescript
 * isChainableReceiver(SyntaxKind.CallExpression);     // true
 * isChainableReceiver(SyntaxKind.Identifier);         // false
 * isChainableReceiver(SyntaxKind.PropertyAccessExpression); // false
 * ```
 */
export function isChainableReceiver(kind: SyntaxKind): boolean {
  const info = RECEIVER_TYPE_MAP[kind];
  return info?.isChainable ?? false;
}

/**
 * Retrieves detailed classification information for a receiver SyntaxKind.
 *
 * @param kind - The TypeScript AST SyntaxKind to classify
 * @returns ReceiverInfo object with classification details, or undefined if unsupported
 *
 * @example
 * ```typescript
 * const info = getReceiverInfo(SyntaxKind.CallExpression);
 * // Returns: { type: "call", isChainable: true, ... }
 * ```
 */
export function getReceiverInfo(kind: SyntaxKind): ReceiverInfo | undefined {
  return RECEIVER_TYPE_MAP[kind];
}

/**
 * Type guard that checks if a SyntaxKind is supported by the receiver classification system.
 *
 * @param kind - The TypeScript AST SyntaxKind to validate
 * @returns `true` if the syntax kind has corresponding receiver information
 *
 * @example
 * ```typescript
 * isSupportedReceiverKind(SyntaxKind.CallExpression);     // true
 * isSupportedReceiverKind(SyntaxKind.NumericLiteral);     // false
 * ```
 */
export function isSupportedReceiverKind(kind: SyntaxKind): boolean {
  return kind in RECEIVER_TYPE_MAP;
}
