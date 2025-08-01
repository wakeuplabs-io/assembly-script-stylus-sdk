import { AbiType } from "../../../../../types/abi.types.js";
import { EmitResult, EmitContext } from "../../../../../types/emit.types.js";
import { IRExpression, IRExpressionBinary } from "../../../../../types/ir.types.js";
import { IExpressionTransformer } from "../interfaces/expression-transformer.interface.js";

/**
 * Transformer for binary expressions.
 * Handles arithmetic operations, assignments, and other binary operations.
 */
export class BinaryTransformer implements IExpressionTransformer {
  canHandle(expr: IRExpression): boolean {
    return expr.kind === "binary";
  }

  transform(
    expr: IRExpression,
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const binary = expr as IRExpressionBinary;
    
    if (binary.op === "=") {
      return this.handleAssignment(binary, context, emitExpression);
    }
    
    return this.handleArithmetic(binary, context, emitExpression);
  }

  private handleAssignment(
    expr: IRExpressionBinary,
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    if (expr.left.kind === "var" && expr.left.scope === "storage") {
      const property = expr.left.name;
      const rightResult = emitExpression(expr.right, context);
      
      if (expr.left.type === AbiType.Bool) {
        return this.handleBooleanStorageAssignment(property, expr, rightResult);
      }
      
      return {
        setupLines: rightResult.setupLines,
        valueExpr: `store_${property}(${rightResult.valueExpr})`
      };
    }
    
    const leftResult = emitExpression(expr.left, context);
    const rightResult = emitExpression(expr.right, context);
   
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
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const leftResult = emitExpression(expr.left, context);
    const rightResult = emitExpression(expr.right, context);
    
    return {
      setupLines: [...leftResult.setupLines, ...rightResult.setupLines],
      valueExpr: `${leftResult.valueExpr} ${expr.op} ${rightResult.valueExpr}`
    };
  }
}
