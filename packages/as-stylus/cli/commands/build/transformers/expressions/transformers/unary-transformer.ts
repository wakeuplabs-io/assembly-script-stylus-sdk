import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/cli/commands/build/transformers/core/contract-context.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, IRUnaryExpression } from "@/cli/types/ir.types.js";

/**
 * Transformer for unary expressions.
 * Handles unary operations like logical NOT, arithmetic negation, etc.
 */
export class UnaryTransformer extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    return expr.kind === "unary";
  }

  handle(unary: IRUnaryExpression): EmitResult {
    const exprResult = this.contractContext.emitExpression(unary.expr);
    
    // Handle boolean operations with Boolean class
    if (unary.op === "!" || unary.op === "not") {
      let result = `Boolean.not(${exprResult.valueExpr})`;
      if (unary.expr.kind === "call" && !exprResult.valueExpr.includes("Boolean.fromABI")) {
        result = `Boolean.not(Boolean.fromABI(${exprResult.valueExpr}))`;
      }

      return {
        setupLines: exprResult.setupLines,
        valueExpr: result
      };
    }
    
    // Handle other unary operations
    return {
      setupLines: exprResult.setupLines,
      valueExpr: `${unary.op}${exprResult.valueExpr}`
    };
  }
}