import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

/**
 * Handler for I256 negate method
 */
export class I256NegateHandler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return target.endsWith(".negate") && expr.args.length === 0;
  }

  /**
   * Processes I256 negate method calls
   */
  handle(
    expr: any,
    _context: EmitContext,
    _emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult {
    const [prop] = expr.target.split(".");
    const tempVar = makeTemp("i256Negate");

    // Handle contract property operations differently
    if (expr.scope === "storage") {
      return {
        setupLines: [
          `const ${tempVar}: usize = I256.copyNew(load_${prop}());`,
          `I256.negate(${tempVar});`
        ],
        valueExpr: tempVar,
        valueType: "I256",
      };
    }

    // For regular object operations
    return {
      setupLines: [
        `const ${tempVar}: usize = I256.copyNew(${prop});`,
        `I256.negate(${tempVar});`
      ],
      valueExpr: tempVar,
      valueType: "I256",
    };
  }
} 