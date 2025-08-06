import { EmitResult } from "../../../../../types/emit.types.js";
import { IRExpression, IRUnaryExpression } from "../../../../../types/ir.types.js";
import { ContractContext } from "../../core/contract-context.js";
import { Handler } from "../../core/interfaces.js";

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
    const exprResult = this.contractContext.emit(unary.expr);
    
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