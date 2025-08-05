import { EmitResult } from "../../../../../types/emit.types.js";
import { IRExpression } from "../../../../../types/ir.types.js";
import { ContractContext } from "../../core/contract-context.js";
import { Handler } from "../../core/interfaces.js";

/**
 * Fallback transformer for unsupported expressions.
 * This transformer handles any expression that doesn't have a specific transformer.
 * It provides a safety net and debugging information for unsupported cases.
 */
export class FallbackTransformer extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(_expr: IRExpression): boolean {
    // Fallback transformer can handle any expression
    return true;
  }

  handle(expr: IRExpression): EmitResult {
    // Log the unsupported expression for debugging
    console.warn(`[FallbackTransformer] Unsupported expression kind: ${expr.kind}`, expr);
    
    return {
      setupLines: [],
      valueExpr: `/* Unsupported expression: ${expr.kind} */`
    };
  }
}