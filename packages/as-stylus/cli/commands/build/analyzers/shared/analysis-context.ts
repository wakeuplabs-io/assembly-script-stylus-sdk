import { ErrorManager } from "./error-manager.js";
import { SymbolTableStack } from "./symbol-table.js";

/**
 * AnalysisContext represents the analysis state for a single contract.
 * It contains the error manager and symbol table for that contract.
 */
export class AnalysisContext {
  private errorManager: ErrorManager;
  private symbolTable: SymbolTableStack;

  constructor() {
    this.errorManager = new ErrorManager();
    this.symbolTable = new SymbolTableStack();
  }

  getErrorManager(): ErrorManager {
    return this.errorManager;
  }

  getSymbolTable(): SymbolTableStack {
    return this.symbolTable;
  }
}