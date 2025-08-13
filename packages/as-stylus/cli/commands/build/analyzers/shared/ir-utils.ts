import { Expression } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { SupportedType } from "./supported-types.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";

/**
 * **IR Building Utilities**
 *
 * Centralized collection of utility functions for Intermediate Representation (IR)
 * construction and manipulation. These utilities reduce code duplication across
 * different analyzers and provide type-safe operations for IR building.
 *
 * **Key Functions:**
 * - **Expression Building**: Convert TypeScript AST to IR expressions
 * - **Type Extraction**: Safe retrieval of type information from IR
 * - **Call IR Construction**: Standardized factory for call expressions
 * - **Validation**: Safety checks for expression processing
 *
 * **Design Principles:**
 * - **Type Safety**: All operations include fallbacks for missing data
 * - **Consistency**: Standardized IR structure across all builders
 * - **Error Handling**: Graceful degradation when expressions are invalid
 * - **Modularity**: Reusable functions across the analyzer pipeline
 *
 * @example
 * ```typescript
 * // Build IR for a single expression
 * const ir = IRUtils.buildExpressionIR(expression);
 *
 * // Extract type information safely
 * const returnType = IRUtils.extractReturnType(ir);
 *
 * // Create standardized call IR
 * const callIR = IRUtils.createCallIR("add", receiver, args, AbiType.Uint256);
 * ```
 */
export class IRUtils {
  /**
   * Converts a TypeScript AST expression to its corresponding IR representation.
   *
   * This is the primary entry point for expression IR building, providing a
   * centralized and consistent approach to AST-to-IR conversion.
   *
   * @param expr - The TypeScript AST expression to convert
   * @returns The corresponding IR expression structure
   *
   * @throws Error if the expression cannot be converted to valid IR
   *
   * @example
   * ```typescript
   * const expr = node.getExpression(); // TypeScript AST node
   * const ir = IRUtils.buildExpressionIR(expr);
   * // Returns: { kind: "call", target: "add", args: [...], ... }
   * ```
   */
  static buildExpressionIR(expr: Expression): IRExpression {
    const builder = new ExpressionIRBuilder(expr);
    return builder.validateAndBuildIR();
  }

  /**
   * Converts multiple TypeScript AST expressions to their IR representations.
   *
   * Useful for processing argument lists, parameter lists, or any collection
   * of expressions that need to be converted together.
   *
   * @param expressions - Array of TypeScript AST expressions to convert
   * @returns Array of corresponding IR expressions
   *
   * @example
   * ```typescript
   * const args = callExpr.getArguments(); // TypeScript AST arguments
   * const argIRs = IRUtils.buildExpressionListIR(args);
   * // Returns: [{ kind: "literal", value: "100" }, { kind: "var", name: "counter" }]
   * ```
   */
  static buildExpressionListIR(expressions: Expression[]): IRExpression[] {
    return expressions.map((expr) => this.buildExpressionIR(expr));
  }

  /**
   * Safely extracts the return type from an IR expression.
   *
   * This function handles the different possible locations where type information
   * might be stored in an IR expression, providing a unified interface for type
   * extraction with proper fallback handling.
   *
   * **Type Resolution Priority:**
   * 1. `returnType` field (for function calls)
   * 2. `type` field (for literals and variables)
   * 3. `AbiType.Unknown` (fallback)
   *
   * @param ir - The IR expression to extract type information from
   * @returns The resolved type or AbiType.Unknown if no type information is available
   *
   * @example
   * ```typescript
   * const callIR = { kind: "call", target: "add", returnType: AbiType.Uint256, ... };
   * const type = IRUtils.extractReturnType(callIR); // AbiType.Uint256
   *
   * const literalIR = { kind: "literal", value: "100", type: AbiType.String };
   * const type2 = IRUtils.extractReturnType(literalIR); // AbiType.String
   * ```
   */
  static extractReturnType(ir: IRExpression): SupportedType {
    if ("returnType" in ir && ir.returnType) {
      return ir.returnType;
    }
    if ("type" in ir && ir.type) {
      return ir.type;
    }
    return AbiType.Unknown;
  }

  /**
   * Creates a standardized call IR structure with consistent formatting.
   *
   * This factory function ensures that all call IR expressions follow the same
   * structure and include all required metadata for proper transformation.
   *
   * @param target - The method or function name being called
   * @param receiver - The IR expression representing the receiver object
   * @param args - Array of IR expressions representing the arguments
   * @param returnType - The expected return type of the call
   * @param scope - The execution scope (memory or storage)
   * @returns A properly formatted call IR expression
   *
   * @example
   * ```typescript
   * const addCallIR = IRUtils.createCallIR(
   *   "add",
   *   { kind: "var", name: "counter", type: AbiType.Uint256 },
   *   [{ kind: "literal", value: "1", type: AbiType.Uint256 }],
   *   AbiType.Uint256
   * );
   * // Returns: { kind: "call", target: "add", receiver: {...}, args: [...], ... }
   * ```
   */
  static createCallIR(
    target: string,
    receiver: IRExpression,
    args: IRExpression[],
    returnType: SupportedType,
    scope: "memory" | "storage" = "memory",
  ): IRExpression {
    return {
      kind: "call",
      target,
      receiver,
      args,
      type: AbiType.Function,
      returnType,
      scope,
    };
  }

  /**
   * Type guard that checks if an IR expression has a receiver field.
   *
   * This type guard provides type-safe access to the receiver field, ensuring
   * that TypeScript knows the receiver exists when the guard returns true.
   *
   * @param ir - The IR expression to check for a receiver
   * @returns Type-safe boolean indicating presence of receiver
   *
   * @example
   * ```typescript
   * if (IRUtils.hasReceiver(ir)) {
   *   // TypeScript knows ir.receiver exists here
   *   console.log(ir.receiver.type);
   * }
   * ```
   */
  static hasReceiver(ir: IRExpression): ir is IRExpression & { receiver: IRExpression } {
    return "receiver" in ir && ir.receiver !== undefined;
  }

  /**
   * Extracts type information with error handling and fallback.
   *
   * This is a wrapper around `extractReturnType` that provides additional
   * error handling and allows for custom fallback types.
   *
   * @param ir - The IR expression to extract type from
   * @param fallback - The type to return if extraction fails
   * @returns The extracted type or the fallback type
   *
   * @example
   * ```typescript
   * const type = IRUtils.safeTypeExtraction(ir, AbiType.String);
   * // Never throws - returns AbiType.String if extraction fails
   * ```
   */
  static safeTypeExtraction(
    ir: IRExpression,
    fallback: SupportedType = AbiType.Unknown,
  ): SupportedType {
    try {
      return this.extractReturnType(ir);
    } catch {
      return fallback;
    }
  }

  /**
   * Validates that a TypeScript expression can be converted to valid IR.
   *
   * This function performs a test conversion to determine if an expression
   * is structurally valid for IR building without throwing errors.
   *
   * @param expr - The TypeScript AST expression to validate
   * @returns `true` if the expression can be converted to valid IR
   *
   * @example
   * ```typescript
   * if (IRUtils.isValidForChaining(expression)) {
   *   // Safe to process this expression
   *   const ir = IRUtils.buildExpressionIR(expression);
   * }
   * ```
   */
  static isValidForChaining(expr: Expression): boolean {
    try {
      this.buildExpressionIR(expr);
      return true;
    } catch {
      return false;
    }
  }
}
