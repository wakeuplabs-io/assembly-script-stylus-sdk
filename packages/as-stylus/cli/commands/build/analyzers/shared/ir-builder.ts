import { Node } from "ts-morph";

import { AnalysisContextFactory } from "./analysis-context-factory.js";
import { ErrorManager } from "./error-manager.js";
import { SymbolTableStack } from "./symbol-table.js";

export abstract class IRBuilder<TResult> {
  public readonly errorManager: ErrorManager;
  public readonly symbolTable: SymbolTableStack;

  constructor(node: Node) {
    const id = node.getSourceFile().getBaseNameWithoutExtension();
    this.errorManager = AnalysisContextFactory.getContext(id).getErrorManager();
    this.symbolTable = AnalysisContextFactory.getContext(id).getSymbolTable();
  }

  protected abstract validate(): boolean;

  public validateAndBuildIR(): TResult {
    if (!this.validate()) {
      //TODO: do action on errors
    }

    return this.buildIR();
  }

  protected abstract buildIR(): TResult;
}
