import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/cli/commands/build/transformers/core/contract-context.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, IRExpressionBinary } from "@/cli/types/ir.types.js";

/**
 * Transformer for binary expressions.
 * Handles arithmetic operations, assignments, and other binary operations.
 */
export class BinaryTransformer extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    return expr.kind === "binary";
  }

  handle(expr: IRExpressionBinary): EmitResult {
    if (expr.op === "=") {
      return this.handleAssignment(expr);
    }
    
    return this.handleArithmetic(expr);
  }

  private handleAssignment(expr: IRExpressionBinary): EmitResult {
    if (expr.left.kind === "var" && expr.left.scope === "storage") {
      const property = expr.left.name;
      const rightResult = this.contractContext.emitExpression(expr.right);
      
      if (expr.left.type === AbiType.Bool) {
        return this.handleBooleanStorageAssignment(property, expr, rightResult);
      }
      
      return {
        setupLines: rightResult.setupLines,
        valueExpr: `store_${property}(${rightResult.valueExpr})`
      };
    }
    
    const leftResult = this.contractContext.emitExpression(expr.left);
    const rightResult = this.contractContext.emitExpression(expr.right);
   
    return {
      setupLines: [...leftResult.setupLines, ...rightResult.setupLines],
      valueExpr: `${leftResult.valueExpr} = ${rightResult.valueExpr}`
    };
  }

  private handleBooleanStorageAssignment(
    property: string,
    expr: IRExpressionBinary,
    rightResult: EmitResult
  ): EmitResult {
    let result = rightResult.valueExpr;

    if (["literal", "var"].includes(expr.right.kind) && expr.right.type === AbiType.Bool) {
      result = `Boolean.create(${rightResult.valueExpr})`;
    }
    
    return {
      setupLines: rightResult.setupLines,
      valueExpr: `store_${property}(${result})`
    };
  }

  private handleArithmetic(
    expr: IRExpressionBinary,
  ): EmitResult {
    const leftResult = this.contractContext.emitExpression(expr.left);
    const rightResult = this.contractContext.emitExpression(expr.right);
    
    return {
      setupLines: [...leftResult.setupLines, ...rightResult.setupLines],
      valueExpr: `${leftResult.valueExpr} ${expr.op} ${rightResult.valueExpr}`
    };
  }
}
