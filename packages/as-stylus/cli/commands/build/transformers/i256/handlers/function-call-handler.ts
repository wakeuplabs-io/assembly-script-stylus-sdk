import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";

/**
 * Handler for I256 function call expressions that return I256
 * Handles internal contract function calls like: increment(value)
 */
export class I256FunctionCallHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: Call): boolean {
    
    // Handle function calls that return U256 (uint256)
    // But exclude factory methods and property operations
    const target = expr.target || "";
    
    if (target.startsWith("I256Factory.") || 
        target.includes(".") || 
        target.includes("_get_") || 
        target.includes("_set_")) {
      return false;
    }
    
    return expr.returnType === AbiType.Int256;
  }

  /**
   * Processes I256 function call expressions
   */
  handle(expr: Call): EmitResult {
    const functionName = expr.target;
    
    
    const argResults = (expr.args || []).map((arg) => this.contractContext.emitExpression(arg));
    const setupLines = argResults.flatMap((result) => result.setupLines);
    const argExprs = argResults.map((result) => result.valueExpr);
    
    // Generate function call
    const functionCall = `${functionName}(${argExprs.join(", ")})`;
    
    return {
      setupLines,
      valueExpr: functionCall,
      valueType: "I256",
    };
  }
}