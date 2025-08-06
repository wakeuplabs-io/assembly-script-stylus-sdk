import { VariableDeclaration, IRStatement } from "@/cli/types/ir.types.js";

import { StatementHandler } from "../base-statement-handler.js";

/**
 * Handler for variable declaration statements (let and const)
 */
export class VariableDeclarationHandler extends StatementHandler {
  canHandle(stmt: IRStatement): boolean {
    return stmt.kind === "let" || stmt.kind === "const";
  }

  handle(stmt: IRStatement, indent: string): string {
    const declaration = stmt as VariableDeclaration;
    const exprResult = this.contractContext.emitExpression(declaration.expr);
    const keyword = declaration.kind; // "let" or "const"

    if (exprResult.setupLines && exprResult.setupLines.length > 0) {
      const lines = [...exprResult.setupLines.map((line) => `${indent}${line}`)];
      lines.push(`${indent}${keyword} ${declaration.name} = ${exprResult.valueExpr};`);
      return lines.join("\n");
    }

    return `${indent}${keyword} ${declaration.name} = ${exprResult.valueExpr};`;
  }
}