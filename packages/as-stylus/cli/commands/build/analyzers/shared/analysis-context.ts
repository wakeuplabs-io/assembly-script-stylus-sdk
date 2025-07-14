import { AbiType } from "@/cli/types/abi.types.js";

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
    this.populatedSymbolTable();
  }

  private populatedSymbolTable(): void {
    this.symbolTable.declareFunction("U256Factory.create", { name: "U256Factory.create", parameters: [], returnType: AbiType.Uint256 });
    this.symbolTable.declareFunction("U256Factory.fromString", { name: "U256Factory.fromString", parameters: [], returnType: AbiType.Uint256 });
    // String
    this.symbolTable.declareFunction("StrFactory.create", { name: "StrFactory.create", parameters: [], returnType: AbiType.String });
    this.symbolTable.declareFunction("StrFactory.fromString", { name: "StrFactory.fromString", parameters: [], returnType: AbiType.String });
    this.symbolTable.declareFunction("StrFactory.toString", { name: "StrFactory.toString", parameters: [], returnType: AbiType.String });
    this.symbolTable.declareFunction("StrFactory.slice", { name: "StrFactory.slice", parameters: [], returnType: AbiType.String });
    this.symbolTable.declareFunction("StrFactory.length", { name: "StrFactory.length", parameters: [], returnType: AbiType.Uint256 });
    this.symbolTable.declareFunction("Address.copy", { name: "Address.copy", parameters: [], returnType: AbiType.Address });

    // Address
    this.symbolTable.declareFunction("AddressFactory.create", { name: "AddressFactory.create",  parameters: [], returnType: AbiType.Address });
    this.symbolTable.declareFunction("Address.equals", { name: "Address.equals", parameters: [], returnType: AbiType.Bool });
    this.symbolTable.declareFunction("Address.isZero", { name: "Address.isZero", parameters: [], returnType: AbiType.Bool });
  }

  getErrorManager(): ErrorManager {
    return this.errorManager;
  }

  getSymbolTable(): SymbolTableStack {
    return this.symbolTable;
  }
}