import { EmitContext, EmitResult } from "../../../../../types/emit.types";
import { ExpressionHandler } from "../../core/interfaces";

/**
 * Handler for U256 toString method calls
 */
export class U256ToStringHandler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return target.endsWith(".toString") && expr.args.length === 0;
  }
  
  /**
   * Processes U256 toString method calls
   */
  handle(
    expr: any, 
    context: EmitContext, 
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const parts = expr.target.split(".");
    const cls = parts[0];
    const prop = parts.length >= 3 ? parts[1] : null;
    
    // Handle contract property operations differently
    if (cls === context.contractName && prop) {
      return {
        setupLines: [],
        valueExpr: `load_${prop}()`,
        valueType: "string"
      };
    }
    
    // For regular object operations
    const targetObj = parts.slice(0, -1).join(".");
    return {
      setupLines: [],
      valueExpr: `U256.toString(${targetObj})`,
      valueType: "string"
    };
  }
}
