import { IRStatement, IRExpression } from "@/cli/types/ir.types.js";

import { ContractContext } from "../core/contract-context.js";

/**
 * Result of emitting a condition with proper setup lines handling
 */
export interface ConditionEmitResult {
  setupLines: string[];
  conditionExpr: string;
}

/**
 * Abstract base class for statement handlers
 * Each statement handler implements a strategy for handling a specific type of statement
 */
export abstract class StatementHandler {
  constructor(protected contractContext: ContractContext) {}

  /**
   * Determines if this handler can process the given statement
   */
  abstract canHandle(stmt: IRStatement): boolean;

  /**
   * Processes the statement and returns the generated code
   * @param stmt The statement to process
   * @param indent The indentation string to use
   * @returns The generated code string
   */
  abstract handle(stmt: IRStatement, indent: string): string;

  /**
   * Safely emits a condition expression with proper setup lines handling
   * This method ensures that all variable declarations from setupLines are emitted
   * before the condition is used, preventing "Cannot find name" errors.
   *
   * @param condition The condition expression to emit
   * @param indent The indentation level for setup lines
   * @returns Object containing setup lines array and clean condition expression
   */
  protected emitConditionWithSetup(condition: IRExpression, indent: string): ConditionEmitResult {
    const condResult = this.contractContext.emitExpression(condition);

    const setupLines: string[] = [];

    // Process setup lines with proper indentation
    if (condResult.setupLines && condResult.setupLines.length > 0) {
      condResult.setupLines.forEach((line) => {
        setupLines.push(`${indent}${line}`);
      });
    }

    return {
      setupLines,
      conditionExpr: condResult.valueExpr,
    };
  }

  /**
   * Recursively collects all setup lines from nested expressions
   * This handles complex nested conditions that may have multiple levels of setup
   *
   * @param expr The expression to analyze
   * @param visited Set of already visited expressions to prevent infinite recursion
   * @returns All setup lines needed for this expression and its dependencies
   */
  protected collectAllSetupLines(
    expr: IRExpression,
    visited: Set<IRExpression> = new Set(),
  ): string[] {
    if (visited.has(expr)) {
      return []; // Prevent infinite recursion
    }
    visited.add(expr);

    const result = this.contractContext.emitExpression(expr);
    const allSetupLines: string[] = [];

    // Add current expression's setup lines
    if (result.setupLines && result.setupLines.length > 0) {
      allSetupLines.push(...result.setupLines);
    }

    // Recursively collect from nested expressions if they exist
    // This handles cases like nested function calls: func(otherFunc(value))
    if (expr.kind === "call" && expr.args && expr.args.length > 0) {
      expr.args.forEach((arg) => {
        const nestedSetup = this.collectAllSetupLines(arg, visited);
        allSetupLines.unshift(...nestedSetup); // Add nested setup BEFORE current setup
      });
    }

    return allSetupLines;
  }
}
