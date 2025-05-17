import { EmitContext, EmitResult } from "../../../../../types/emit.types";
import { ExpressionHandler } from "../../core/interfaces";

/**
 * Handler for U256 operation methods (add, sub)
 */
export class U256OperationHandler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return target.endsWith(".add") || target.endsWith(".sub");
  }
  
  /**
   * Processes U256 operation method calls
   */
  handle(
    expr: any, 
    context: EmitContext, 
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const parts = expr.target.split(".");
    const cls = parts[0];
    const prop = parts.length >= 3 ? parts[1] : null;
    const op = parts[parts.length - 1];
    
    const argRes = emitExprFn(expr.args[0], context);
    
    // Handle contract property operations differently
    if (cls === context.contractName && prop) {
      return {
        setupLines: [...argRes.setupLines],
        valueExpr: `U256.${op}(load_${prop}(), ${argRes.valueExpr})`,
        valueType: "U256"
      };
    }
    
    // For regular object operations
    const targetObj = parts.slice(0, -1).join(".");
    return {
      setupLines: [...argRes.setupLines],
      valueExpr: `U256.${op}(${targetObj}, ${argRes.valueExpr})`,
      valueType: "U256"
    };
  }
}
