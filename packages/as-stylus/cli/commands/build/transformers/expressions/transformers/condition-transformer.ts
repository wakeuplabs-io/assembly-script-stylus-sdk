import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/cli/commands/build/transformers/core/contract-context.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, IRCondition } from "@/cli/types/ir.types.js";

const RELATIONAL_OPERATORS = ["<", ">", "<=", ">=", "==", "!="] as const;
type RelationalOperator = (typeof RELATIONAL_OPERATORS)[number];

/**
 * Transformer for condition expressions.
 * Handles relational operations and comparisons with proper type handling.
 */
export class ConditionTransformer extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    return expr.kind === "condition";
  }

  handle(condition: IRCondition): EmitResult {
    // Handle single expression conditions (like boolean-returning method calls)
    if (!condition.right) {
      const leftResult = this.contractContext.emitExpression(condition.left);
      return {
        setupLines: leftResult.setupLines,
        valueExpr: leftResult.valueExpr,
      };
    }

    // Special handling for Address.equals calls to prevent mangling
    if (condition.left.kind === "call" && condition.left.target === "Address.equals") {
      // Directly handle Address.equals calls
      const argResults =
        condition.left.args?.map((arg) => this.contractContext.emitExpression(arg)) || [];
      if (argResults.length >= 2) {
        const allSetupLines = argResults.flatMap((result) => result.setupLines);
        return {
          setupLines: allSetupLines,
          valueExpr: `Address.equals(${argResults[0].valueExpr}, ${argResults[1].valueExpr})`,
        };
      }
    }

    // Don't apply relational comparison logic to method calls that already return boolean
    if (condition.left.kind === "call" && condition.left.returnType === "bool") {
      const leftResult = this.contractContext.emitExpression(condition.left);
      return {
        setupLines: leftResult.setupLines,
        valueExpr: leftResult.valueExpr,
      };
    }

    if (condition.op && this.isRelationalOperator(condition.op)) {
      return this.handleRelationalComparison(condition);
    }

    // Handle other binary conditions
    const leftResult = this.contractContext.emitExpression(condition.left);
    const rightResult = this.contractContext.emitExpression(condition.right!);

    return {
      setupLines: [...leftResult.setupLines, ...rightResult.setupLines],
      valueExpr: `${leftResult.valueExpr} ${condition.op} ${rightResult.valueExpr}`,
    };
  }

  private handleRelationalComparison(condition: IRCondition): EmitResult {
    const leftResult = this.contractContext.emitExpression(condition.left);
    const rightResult = this.contractContext.emitExpression(condition.right!);

    // Detect type class (I256 vs U256)
    const typeClass = this.detectTypeClass(condition.left);
    const method = this.getComparisonMethod(condition.op!, typeClass);

    return {
      setupLines: [...leftResult.setupLines, ...rightResult.setupLines],
      valueExpr: method
        .replace("${left}", leftResult.valueExpr)
        .replace("${right}", rightResult.valueExpr),
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
