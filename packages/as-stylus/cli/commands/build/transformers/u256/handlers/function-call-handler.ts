import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for U256 function call expressions that return U256
 * Handles internal contract function calls like: increment(value)
 */
export class U256FunctionCallHandler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;
    
    // Handle function calls that return U256 (uint256)
    // But exclude factory methods and property operations
    const target = expr.target || "";
    
    if (target.startsWith("U256Factory.") || 
        target.includes(".") || 
        target.includes("_get_") || 
        target.includes("_set_")) {
      return false;
    }
    
    return expr.returnType === "uint256";
  }

  /**
   * Processes U256 function call expressions
   */
  handle(
    expr: any,
    context: EmitContext,
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult,
  ): EmitResult {
    const functionName = expr.target;
    
    // Process arguments
    const argResults = (expr.args || []).map((arg: any) => emitExprFn(arg, context));
    const setupLines = argResults.flatMap((result: any) => result.setupLines);
    const argExprs = argResults.map((result: any) => result.valueExpr);
    
    // Generate function call
    const functionCall = `${functionName}(${argExprs.join(", ")})`;
    
    return {
      setupLines,
      valueExpr: functionCall,
      valueType: "U256",
    };
  }
}