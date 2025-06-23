import { Node } from "ts-morph";

import { AnalysisContextFactory } from "./analysis-context-factory.js";
import { ErrorManager } from "./error-manager.js";
import { SymbolTableStack } from "./symbol-table.js";

export abstract class BaseValidator {
  protected readonly errorManager: ErrorManager;
  protected readonly symbolTable: SymbolTableStack;
  protected readonly filePath: string;
  protected readonly line: number;

  constructor(node: Node) {
    this.filePath = node.getSourceFile().getFilePath();
    this.line = node.getStartLineNumber();
    const id = node.getSourceFile().getBaseNameWithoutExtension();

    this.errorManager = AnalysisContextFactory.getContext(id).getErrorManager();
    this.symbolTable = AnalysisContextFactory.getContext(id).getSymbolTable();
  }

  abstract validate(): boolean;

  protected addSyntaxError(code: string): void {
    this.errorManager.addSyntaxError(code, this.filePath, this.line);
  }

  protected addSemanticError(code: string, args?: string[]): void {
    this.errorManager.addSemanticError(code, this.filePath, this.line, args);
  }
}
