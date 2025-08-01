import { EmitResult, EmitContext } from "../../../../../types/emit.types.js";
import { IRExpression, IRCondition } from "../../../../../types/ir.types.js";
import { RELATIONAL_OPERATORS, RelationalOperator } from "../constants/expression-constants.js";
import { IExpressionTransformer } from "../interfaces/expression-transformer.interface.js";

/**
 * Transformer for condition expressions.
 * Handles relational operations and comparisons with proper type handling.
 */
export class ConditionTransformer implements IExpressionTransformer {
  canHandle(expr: IRExpression): boolean {
    return expr.kind === "condition";
  }

  transform(
    expr: IRExpression,
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const condition = expr as IRCondition;
    
    // Handle relational operators
    if (condition.op && this.isRelationalOperator(condition.op)) {
      return this.handleRelationalComparison(condition, context, emitExpression);
    }
    
    // Handle single expression conditions
    if (!condition.right) {
      const leftResult = emitExpression(condition.left, context);
      return {
        setupLines: leftResult.setupLines,
        valueExpr: leftResult.valueExpr
      };
    }
    
    // Handle other binary conditions
    const leftResult = emitExpression(condition.left, context);
    const rightResult = emitExpression(condition.right, context);
    
    return {
      setupLines: [...leftResult.setupLines, ...rightResult.setupLines],
      valueExpr: `${leftResult.valueExpr} ${condition.op} ${rightResult.valueExpr}`
    };
  }

  private handleRelationalComparison(
    condition: IRCondition,
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const leftResult = emitExpression(condition.left, context);
    const rightResult = emitExpression(condition.right!, context);
    
    // Detect type class (I256 vs U256)
    const typeClass = this.detectTypeClass(condition.left);
    const method = this.getComparisonMethod(condition.op!, typeClass);
    
    return {
      setupLines: [...leftResult.setupLines, ...rightResult.setupLines],
      valueExpr: method.replace("${left}", leftResult.valueExpr).replace("${right}", rightResult.valueExpr)
    };
  }

  private isRelationalOperator(op: string): boolean {
    return RELATIONAL_OPERATORS.includes(op as RelationalOperator);
  }

  private detectTypeClass(expr: IRExpression): string {
    if (expr.kind === "var" && expr.type === "int256") {
      return "I256";
    }
    return "U256";
  }

  private getComparisonMethod(op: string, typeClass: string): string {
    switch (op) {
      case "<":
        return `${typeClass}.lessThan(\${left}, \${right})`;
      case ">":
        return `${typeClass}.greaterThan(\${left}, \${right})`;
      case "==":
        return `${typeClass}.equals(\${left}, \${right})`;
      case "!=":
        return `!${typeClass}.equals(\${left}, \${right})`;
      case "<=":
        return `!${typeClass}.greaterThan(\${left}, \${right})`;
      case ">=":
        return `!${typeClass}.lessThan(\${left}, \${right})`;
      default:
        return `${typeClass}.equals(\${left}, \${right})`;
    }
  }
}