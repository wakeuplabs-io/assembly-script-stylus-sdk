import { AbiType } from "@/cli/types/abi.types.js";
import { Return, IRStatement } from "@/cli/types/ir.types.js";

import { StatementHandler } from "../base-statement-handler.js";

/**
 * Handler for return statements
 */
export class ReturnHandler extends StatementHandler {
  canHandle(stmt: IRStatement): boolean {
    return stmt.kind === "return";
  }

  private buildReturnWithSetup(setupLines: string[], returnExpr: string, indent: string): string {
    if (setupLines.length === 0) {
      return `${indent}return ${returnExpr};`;
    }

    const lines = setupLines.map((line) => `${indent}${line}`);
    lines.push(`${indent}return ${returnExpr};`);
    return lines.join("\n");
  }

  handle(stmt: IRStatement, indent: string): string {
    const returnStmt = stmt as Return;
    if (!returnStmt.expr) {
      return `${indent}return;`;
    }

    const exprResult = this.contractContext.emitExpression(returnStmt.expr);
    const type = returnStmt.expr.type as AbiType;

    if (returnStmt.expr.kind === "call") {
      return this.buildReturnWithSetup(exprResult.setupLines, exprResult.valueExpr, indent);
    }

    let baseExpr = exprResult.valueExpr;

    if (
      type === AbiType.ArrayDynamic &&
      returnStmt.expr.kind === "var" &&
      returnStmt.expr.scope === "storage"
    ) {
      baseExpr = `ArrayDynamic.serializeComplete(${exprResult.valueExpr})`;
    }

    if (
      (type === AbiType.ArrayDynamic || type.toString() === "array_dynamic") &&
      this.isMemoryArrayReturn(returnStmt.expr)
    ) {
      baseExpr = `Array.serializeToABI(${exprResult.valueExpr})`;
    }

    return this.buildReturnWithSetup(exprResult.setupLines, baseExpr, indent);
  }

  /**
   * Check if this expression represents a memory array that needs ABI serialization
   */
  private isMemoryArrayReturn(expr: any): boolean {
    if (
      expr.kind === "var" &&
      expr.scope === "memory" &&
      (expr.type === "array_dynamic" || expr.type === AbiType.ArrayDynamic)
    ) {
      return true;
    }

    if (expr.kind === "call" && expr.target) {
      const isMemoryArrayMethod =
        expr.target.includes("makeMemoryArray") ||
        expr.target.includes("makeFixedMemoryArray") ||
        expr.target.includes("MemoryArrayFactory");
      return isMemoryArrayMethod;
    }

    return false;
  }
}
