import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";
import { MethodName, METHOD_GROUPS } from "@/cli/types/method-types.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";
import { I256AbsHandler } from "./handlers/abs-handler.js";
import { I256ComparisonHandler } from "./handlers/comparison-handler.js";
import { I256CreateHandler } from "./handlers/create-handler.js";
import { I256FromStringHandler } from "./handlers/from-string-handler.js";
import { I256FromU256Handler } from "./handlers/from-u256-handler.js";
import { I256NegateHandler } from "./handlers/negate-handler.js";
import { I256OperationHandler } from "./handlers/operation-handler.js";
import { I256PropertyHandler } from "./handlers/property-handler.js";
import { I256ToStringHandler } from "./handlers/to-string-handler.js";
import { ContractContext } from "../core/contract-context.js";
import { I256FunctionCallHandler } from "./handlers/function-call-handler.js";

/**
 * **I256 Type Transformer**
 *
 * Handles the transformation of I256 (signed 256-bit integer) expressions from TypeScript
 * to AssemblyScript. This transformer manages signed integer operations including negative
 * numbers, absolute values, and type conversions.
 *
 * **Supported Operations:**
 * - **Factory Methods**: `I256Factory.create()`, `I256Factory.fromString()`, `I256Factory.fromU256()`
 * - **Arithmetic**: `add()`, `sub()`, `mul()`, `div()`, `mod()`, `pow()`
 * - **Comparisons**: `lessThan()`, `greaterThan()`, `equals()`, etc.
 * - **Signed Operations**: `abs()`, `negate()`, `isNegative()`
 * - **Type Conversions**: `toU256()`, `toString()`
 *
 * **Key Differences from U256:**
 * - Supports negative values and sign-specific operations
 * - Includes `abs()` method that returns U256 (positive value)
 * - Has `isNegative()` property for sign checking
 * - `fromU256()` conversion for unsigned to signed conversion
 *
 * **Handler Registration Order:**
 * 1. CreateHandler - Factory creation methods
 * 2. FromStringHandler - String to I256 conversion
 * 3. FromU256Handler - U256 to I256 conversion
 * 4. OperationHandler - Arithmetic operations
 * 5. ComparisonHandler - Boolean comparisons
 * 6. PropertyHandler - Property access (isNegative)
 * 7. NegateHandler - Sign negation
 * 8. ToStringHandler - String conversion
 * 9. AbsHandler - Absolute value (returns U256)
 *
 * @example
 * ```typescript
 * // Input TypeScript
 * const negative = I256Factory.fromString("-100");
 * const absolute = negative.abs();  // Returns U256
 * const isNeg = negative.isNegative; // Returns boolean
 *
 * // Output AssemblyScript
 * const negative: usize = I256.fromString("-100");
 * const absolute: usize = I256.abs(negative);
 * const isNeg: boolean = I256.isNegative(negative);
 * ```
 */
export class I256Transformer extends BaseTypeTransformer {
  /**
   * Initializes the I256 transformer with all specialized handlers.
   *
   * @param contractContext - The compilation context containing type information and utilities
   */
  constructor(contractContext: ContractContext) {
    super(contractContext, "I256");

    this.registerHandler(new I256CreateHandler(contractContext));
    this.registerHandler(new I256FromStringHandler(contractContext));
    this.registerHandler(new I256FromU256Handler(contractContext));
    this.registerHandler(new I256OperationHandler(contractContext));
    this.registerHandler(new I256ComparisonHandler(contractContext));
    this.registerHandler(new I256PropertyHandler(contractContext));
    this.registerHandler(new I256NegateHandler(contractContext));
    this.registerHandler(new I256ToStringHandler(contractContext));
    this.registerHandler(new I256AbsHandler(contractContext));
    this.registerHandler(new I256FunctionCallHandler(contractContext));
  }

  /**
   * Determines whether this transformer can handle the given IR expression.
   *
   * **Detection Strategy:**
   * 1. **Factory Methods**: `I256Factory.create/fromString/fromU256`
   * 2. **Return Type Matching**: Expressions returning `int256`
   * 3. **Boolean Methods**: I256-specific methods returning boolean
   * 4. **String Methods**: I256-specific string conversion methods
   *
   * **I256-Specific Detection:**
   * - `isNegative()` - Only available on signed integers
   * - `abs()` - Sign-specific absolute value operation
   * - Factory methods with `fromU256()` conversion
   *
   * @param expr - The IR expression to evaluate
   * @returns `true` if this transformer should handle the expression
   *
   * @example
   * ```typescript
   * // These expressions return true:
   * I256Factory.fromString("-42")     // Factory method
   * I256Factory.fromU256(unsignedVal) // Type conversion
   * signedValue.isNegative()          // I256-specific property
   * negative.abs()                    // I256-specific operation
   * ```
   */
  canHandle(expr: IRExpression): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";

    if (
      target === "I256Factory.create" ||
      target === "I256Factory.fromString" ||
      target === "I256Factory.fromU256"
    ) {
      return true;
    }

    if (
      (target === MethodName.Create || target === MethodName.FromString || target === "fromU256") &&
      expr.receiver
    ) {
      if (expr.receiver.kind === "var" && expr.receiver.name === "I256Factory") {
        return true;
      }
    }

    if (target === "I256.copy") {
      return true;
    }

    if (expr.returnType === AbiType.Int256) {
      if (expr.originalType || target.includes("_get_") || target.includes("_set_")) {
        return false;
      }
      return true;
    }

    if (expr.returnType === AbiType.Bool) {
      if (target.endsWith(".isNegative")) {
        return true;
      }

      //const arg = expr.args[0];      
      const comparisonMethods = METHOD_GROUPS.COMPARISON.map((method) => `.${method}`);
      if (comparisonMethods.some((method) => target.endsWith(method))) {
        // if (arg.type === AbiType.Int256) {
        //   return true;
        // }
        return true;
      }
    }

    if (expr.returnType === AbiType.String) {
      if (target.endsWith(`.${MethodName.ToString}`)) {
        if (target.startsWith("I256.")) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Fallback handler for expressions that don't match any specialized handler.
   *
   * This method is called when `canHandle()` returns `true` but no registered
   * handler can process the expression. It generates an error comment in the
   * output code to help with debugging.
   *
   * @param expr - The unhandled IR expression
   * @returns EmitResult containing an error comment and default type information
   *
   * @internal This method should rarely be called in a well-configured transformer
   */
  protected handleDefault(expr: IRExpression): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported I256 expression: ${expr.kind} */`,
      valueType: "I256",
    };
  }
}
