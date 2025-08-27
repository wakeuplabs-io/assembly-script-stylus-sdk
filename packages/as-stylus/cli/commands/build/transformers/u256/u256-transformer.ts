import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRExpression } from "@/cli/types/ir.types.js";
import { MethodName, METHOD_GROUPS } from "@/cli/types/method-types.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";
import { ContractContext } from "../core/contract-context.js";
import { U256ChainedCallHandler } from "./handlers/chained-call-handler.js";
import { U256ComparisonHandler } from "./handlers/comparison-handler.js";
import { U256CopyHandler } from "./handlers/copy-handler.js";
import { U256CreateHandler } from "./handlers/create-handler.js";
import { U256FromStringHandler } from "./handlers/from-string-handler.js";
import { U256FunctionCallHandler } from "./handlers/function-call-handler.js";
import { U256OperationHandler } from "./handlers/operation-handler.js";
import { U256ToStringHandler } from "./handlers/to-string-handler.js";

/**
 * **U256 Type Transformer**
 *
 * Handles the transformation of U256 (unsigned 256-bit integer) expressions from TypeScript
 * to AssemblyScript. This transformer implements a modular handler pattern to manage
 * different types of U256 operations.
 *
 * **Supported Operations:**
 * - **Factory Methods**: `U256Factory.create()`, `U256Factory.fromString()`
 * - **Arithmetic**: `add()`, `sub()`, `mul()`, `div()`, `mod()`, `pow()`
 * - **Comparisons**: `lessThan()`, `greaterThan()`, `equals()`, etc.
 * - **Chained Calls**: `U256Factory.fromString("2").add(counter)`
 * - **Utility**: `copy()`, `toString()`, `isZero()`
 *
 * **Handler Priority (execution order):**
 * 1. ChainedCallHandler - Complex factory method chains
 * 2. CreateHandler - Factory creation methods
 * 3. CopyHandler - Object copying operations
 * 4. FromStringHandler - String to U256 conversion
 * 5. OperationHandler - Arithmetic operations
 * 6. ComparisonHandler - Boolean comparisons
 * 7. ToStringHandler - String conversion
 * 8. FunctionCallHandler - Generic function calls
 *
 * **Type Safety Features:**
 * - Prevents interference with other types (boolean, address, string)
 * - Validates receiver structure for modern IR format
 * - Supports both legacy and modern call patterns
 *
 * @example
 * ```typescript
 * // Input TypeScript
 * const result = U256Factory.fromString("100").add(counter);
 *
 * // Output AssemblyScript
 * const __temp_0: usize = U256.fromString("100");
 * const result: usize = U256.add(__temp_0, counter);
 * ```
 */
export class U256Transformer extends BaseTypeTransformer {
  /**
   * Initializes the U256 transformer with all specialized handlers.
   *
   * Handlers are registered in priority order - the first registered handler
   * that can handle an expression will process it.
   *
   * @param contractContext - The compilation context containing type information and utilities
   */
  constructor(contractContext: ContractContext) {
    super(contractContext, "U256");

    this.registerHandler(new U256ChainedCallHandler(contractContext));
    this.registerHandler(new U256CreateHandler(contractContext));
    this.registerHandler(new U256CopyHandler(contractContext));
    this.registerHandler(new U256FromStringHandler(contractContext));
    this.registerHandler(new U256OperationHandler(contractContext));
    this.registerHandler(new U256ComparisonHandler(contractContext));
    this.registerHandler(new U256ToStringHandler(contractContext));
    this.registerHandler(new U256FunctionCallHandler(contractContext));
  }

  /**
   * Determines whether this transformer can handle the given IR expression.
   *
   * Uses a multi-stage detection algorithm:
   * 1. **Priority**: Chained factory calls (e.g., `U256Factory.fromString().add()`)
   * 2. **Factory methods**: `U256Factory.create()`, `U256Factory.fromString()`
   * 3. **Return type validation**: Expressions returning `uint256` or `bool`
   * 4. **Method name matching**: U256-specific operations
   * 5. **Type exclusion**: Prevents conflicts with other transformers
   *
   * @param expr - The IR expression to evaluate
   * @returns `true` if this transformer should handle the expression
   *
   * @example
   * ```typescript
   * // These expressions return true:
   * U256Factory.fromString("100").add(counter)  // Chained call
   * U256Factory.create(42)                      // Factory method
   * counter.mul(three)                          // U256 operation
   * amount.lessThan(limit)                      // U256 comparison
   * ```
   */
  canHandle(expr: IRExpression): boolean {
    if (expr.kind !== "call") return false;

    const target = expr.target || "";

    if (expr.receiver && expr.receiver.kind === "call") {
      const receiverTarget = expr.receiver.target || "";
      const receiverReceiver = expr.receiver.receiver;

      if (
        receiverTarget === "fromString" &&
        receiverReceiver &&
        receiverReceiver.kind === "var" &&
        receiverReceiver.name === "U256Factory"
      ) {
        const u256ChainableMethods = [
          MethodName.Add,
          MethodName.Sub,
          MethodName.Mul,
          MethodName.Div,
          MethodName.Mod,
          MethodName.Pow,
          MethodName.LessThan,
          MethodName.GreaterThan,
          MethodName.Equals,
        ];
        return u256ChainableMethods.includes(target as MethodName);
      }
    }

    if ((target === MethodName.Create || target === MethodName.FromString) && expr.receiver) {
      if (expr.receiver.kind === "var" && expr.receiver.name === "U256Factory") {
        return true;
      }
    }

    if (expr.returnType === AbiType.Uint256) {
      if (expr.originalType || target.includes("_get_") || target.includes("_set_")) {
        return false;
      }
      return true;
    }

    if (target.startsWith("U256.")) {
      return true;
    }

    if (target.includes(".") || expr.receiver) {
      if (
        target.startsWith("boolean.") ||
        target.startsWith("address.") ||
        target.startsWith("string.") ||
        target.startsWith("str.")
      ) {
        return false;
      }

      let methodName: string;

      if (expr.receiver) {
        methodName = target;
      } else {
        methodName = target.split(".").pop() || "";
      }

      const u256Methods = [
        ...METHOD_GROUPS.ARITHMETIC,
        ...METHOD_GROUPS.COMPARISON,
        MethodName.ToString,
        "copy",
      ];

      if (u256Methods.includes(methodName)) {
        if (expr.receiver) {
          const hasU256Receiver = expr.receiver.type === AbiType.Uint256;
          const hasU256Return =
            (expr.returnType as AbiType) === AbiType.Uint256 ||
            (expr.returnType as AbiType) === AbiType.Bool;
          
          // TODO: check if this is needed
          // if (arg.type === AbiType.Uint256) {
          //   return true;
          // }
          return hasU256Receiver || hasU256Return;
        }

        return (
          (expr.returnType as AbiType) === AbiType.Uint256 ||
          (expr.returnType as AbiType) === AbiType.Bool
        );
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
   * @param callExpression - The unhandled call expression
   * @returns EmitResult containing an error comment and default type information
   *
   * @internal This method should rarely be called in a well-configured transformer
   */
  protected handleDefault(callExpression: Call): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported U256 expression: ${JSON.stringify(callExpression) || ""} */`,
      valueType: "U256",
    };
  }
}
