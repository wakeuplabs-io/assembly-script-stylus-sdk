import { createEmitContext, updateIsInStatement } from "./context/emit-context-manager.js";
import { transformExpression } from "./registry/expression-registry.js";
import { EmitResult, EmitContext } from "../../../../types/emit.types.js";
import { IRExpression } from "../../../../types/ir.types.js";

/**
 * Much simpler expression handler - no complex initialization or registry management.
 */
export class ExpressionHandler {
  private baseContext: EmitContext;

  constructor(contractName: string = "", parentName: string = "") {
    this.baseContext = createEmitContext(contractName, parentName);
  }

  /**
   * Update the base context with contract information
   */
  updateContext(contractName: string, parentName?: string): void {
    this.baseContext = createEmitContext(contractName, parentName || "");
  }

  /**
   * Main function to emit code from an expression.
   */
  emitExpression(expr: IRExpression, isInStatement: boolean = false): EmitResult {
    const context = updateIsInStatement(this.baseContext, isInStatement);
    
    // Create wrapper to adapt signature for transformExpression
    const emitExpressionWrapper = (expr: IRExpression, ctx: EmitContext): EmitResult => {
      return this.emitExpression(expr, ctx.isInStatement);
    };
    
    return transformExpression(expr, context, emitExpressionWrapper);
  }
}