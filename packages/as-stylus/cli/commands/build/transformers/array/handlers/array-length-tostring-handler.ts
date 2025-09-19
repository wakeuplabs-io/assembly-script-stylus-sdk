import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";

/**
 * Handler for array.length.toString() expressions
 * Transforms calls like values.length.toString() to string conversion
 */
export class ArrayLengthToStringHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: Call): boolean {
    const target = expr.target || "";

    // Handle calls like "values.length.toString" or "array.length.toString"
    if (target.includes(".length.toString")) {
      return true;
    }

    return false;
  }

  /**
   * Processes array.length.toString method calls
   */
  handle(expr: Call): EmitResult {
    const target = expr.target || "";

    if (target.includes(".length.toString")) {
      // Extract array variable name from "arrayname.length.toString"
      const arrayName = target.replace(".length.toString", "");

      // Generate array length access and convert to string
      return {
        setupLines: [],
        valueExpr: `${arrayName}.length.toString()`, // Pass through - this should work in AssemblyScript
        valueType: "string",
      };
    }

    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported array length toString expression: ${JSON.stringify(expr)} */`,
      valueType: "string",
    };
  }
}
