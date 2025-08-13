import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/cli/commands/build/transformers/core/contract-context.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

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