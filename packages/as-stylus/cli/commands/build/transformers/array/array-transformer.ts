import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRExpression } from "@/cli/types/ir.types.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";
import { ContractContext } from "../core/contract-context.js";
import { ArrayAccessHandler } from "./handlers/array-access-handler.js";
import { ArrayAssignmentHandler } from "./handlers/array-assignment-handler.js";
import { ArrayLengthToStringHandler } from "./handlers/array-length-tostring-handler.js";
import { ArrayLiteralHandler } from "./handlers/array-literal-handler.js";
import { ArrayMethodHandler } from "./handlers/array-method-handler.js";
import { DynamicArrayFactoryHandler } from "./handlers/dynamic-array-factory-handler.js";
import { MemoryArrayFactoryHandler } from "./handlers/memory-array-factory-handler.js";
import { StaticArrayFactoryHandler } from "./handlers/static-array-factory-handler.js";

/**
 * Array Type Transformer
 *
 * Handles transformation of array expressions from TypeScript to AssemblyScript.
 * Supports factory methods, array access, literals, and basic operations.
 */
export class ArrayTransformer extends BaseTypeTransformer {
  /**
   * Initializes the Array transformer with all specialized handlers.
   *
   * Handlers are registered in priority order - the first registered handler
   * that can handle an expression will process it.
   *
   * @param contractContext - The compilation context containing type information and utilities
   */
  constructor(contractContext: ContractContext) {
    super(contractContext, "Array");

    this.registerHandler(new StaticArrayFactoryHandler(contractContext));
    this.registerHandler(new DynamicArrayFactoryHandler(contractContext));
    this.registerHandler(new MemoryArrayFactoryHandler(contractContext));
    this.registerHandler(new ArrayAccessHandler(contractContext));
    this.registerHandler(new ArrayAssignmentHandler(contractContext));
    this.registerHandler(new ArrayLiteralHandler(contractContext));
    this.registerHandler(new ArrayLengthToStringHandler(contractContext));
    this.registerHandler(new ArrayMethodHandler(contractContext));
  }

  /**
   * Determines whether this transformer can handle the given IR expression.
   */
  canHandle(expr: IRExpression): boolean {
    // Handle array access and assignment
    if (
      expr.kind === "array_access" ||
      expr.kind === "array_assignment" ||
      expr.kind === "array_literal"
    ) {
      return true;
    }

    if (expr.kind === "call") {
      const target = (expr as any).target || "";
      const receiver = (expr as any).receiver;

      if (
        target.includes("ArrayFactory") ||
        (receiver?.name &&
          ["StaticArrayFactory", "DynamicArrayFactory", "MemoryArrayFactory"].includes(
            receiver.name,
          ))
      ) {
        return true;
      }

      if (["push", "pop", "length"].includes(target)) {
        if (
          receiver?.type &&
          [AbiType.Array, AbiType.ArrayStatic, AbiType.ArrayDynamic].includes(receiver.type)
        ) {
          return true;
        }
        if (receiver?.kind === "var" && receiver.scope === "storage") {
          return true;
        }
      }

      if (
        [AbiType.Array, AbiType.ArrayStatic, AbiType.ArrayDynamic].includes(
          (expr as any).returnType,
        )
      ) {
        return true;
      }

      if (target.includes(".length.toString")) {
        return true;
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
      valueExpr: `/* Error: Unsupported Array expression: ${JSON.stringify(callExpression) || ""} */`,
      valueType: "usize", // Arrays are represented as pointers
    };
  }
}
