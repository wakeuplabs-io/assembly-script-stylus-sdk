import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, IRStatement } from "@/cli/types/ir.types.js";

import { TransformerRegistry } from "./transformer-registry.js";
import { StatementHandler } from "../statements/statement-handler.js";

/** Context manager for expression transformations */
export class ContractContext {
  private contractName: string;
  private parentName: string;
  private transformerRegistry: TransformerRegistry;
  /** Current function return type for context-aware interface call handling */
  public currentFunctionReturnType?: string;

  constructor(transformerRegistry: TransformerRegistry, contractName: string = "", parentName: string = "") {
    this.contractName = contractName;
    this.parentName = parentName;
    this.transformerRegistry = transformerRegistry;
  }

  getContractName(): string {
    return this.contractName;
  }

  getParentName(): string {
    return this.parentName;
  }

  emitExpression(expr: IRExpression): EmitResult {
    const transformer = this.transformerRegistry.detectExpressionType(expr);
    return transformer ? transformer.handle(expr) : {
      setupLines: [],
      valueExpr: expr.toString()
    };
  }

  emitStatements(statements: IRStatement[]): string { 
    const statementHandler = new StatementHandler(this);
    return statementHandler.handleStatements(statements);
  }
}