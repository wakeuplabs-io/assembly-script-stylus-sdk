import { AbiType } from "@/cli/types/abi.types.js";
import { Return, IRStatement } from "@/cli/types/ir.types.js";

import { SupportedType } from "../../../analyzers/shared/supported-types.js";
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
    
    const lines = setupLines.map(line => `${indent}${line}`);
    lines.push(`${indent}return ${returnExpr};`);
    return lines.join("\n");
  }

  handle(stmt: IRStatement, indent: string): string {
    const returnStmt = stmt as Return;
    
    // Handle empty return
    if (!returnStmt.expr) {
      return `${indent}return;`;
    }

    const exprResult = this.contractContext.emitExpression(returnStmt.expr);
    let type = (returnStmt.expr as { type: SupportedType }).type;

    const isStruct = returnStmt.expr.kind === "call" && returnStmt.expr.args.length > 0 && returnStmt.expr.args[0].type === AbiType.Struct;
    if (isStruct) {
      type = AbiType.Struct;
    }

    // Handle call expressions
    if (returnStmt.expr.kind === "call") {
      return this.buildReturnWithSetup(exprResult.setupLines, exprResult.valueExpr, indent);
    }

    let baseExpr = exprResult.valueExpr;
    
    // Handle string return types
    if (type === AbiType.String) {
      baseExpr = `Str.toABI(${exprResult.valueExpr})`;
    }

    // Handle boolean mappings and regular booleans
    const isBooleanMapping = baseExpr.includes("MappingNested.getBoolean") || 
                             baseExpr.includes("Mapping.getBoolean");
    let returnExpr: string;

    if (isBooleanMapping) {
      // Mapping booleans already return correct 32-byte format
      returnExpr = `Boolean.create(${baseExpr})`;
    } else if (type === AbiType.Bool && !baseExpr.includes("_storage")) {
      // Regular boolean literals get wrapped with Boolean.create()
      returnExpr = `Boolean.create(${baseExpr})`;
    } else {
      returnExpr = baseExpr;
    }

    return this.buildReturnWithSetup(exprResult.setupLines, returnExpr, indent);
  }
}