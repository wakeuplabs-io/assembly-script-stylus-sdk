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
    this.symbolTable.declareFunction("U256Factory.create", { name: "U256Factory.create", parameters: [], returnType: AbiType.Uint256, isDeclaredByUser: false });
    this.symbolTable.declareFunction("U256Factory.fromString", { name: "U256Factory.fromString", parameters: [], returnType: AbiType.Uint256, isDeclaredByUser: false });
    
    // I256
    this.symbolTable.declareFunction("I256Factory.create", { name: "I256Factory.create", parameters: [], returnType: AbiType.Int256, isDeclaredByUser: false });
    this.symbolTable.declareFunction("I256Factory.fromString", { name: "I256Factory.fromString", parameters: [], returnType: AbiType.Int256, isDeclaredByUser: false });
    
    // String
    this.symbolTable.declareFunction("StrFactory.create", { name: "StrFactory.create", parameters: [], returnType: AbiType.String, isDeclaredByUser: false });
    this.symbolTable.declareFunction("StrFactory.fromString", { name: "StrFactory.fromString", parameters: [], returnType: AbiType.String, isDeclaredByUser: false });
    this.symbolTable.declareFunction("StrFactory.toString", { name: "StrFactory.toString", parameters: [], returnType: AbiType.String, isDeclaredByUser: false });
    this.symbolTable.declareFunction("StrFactory.slice", { name: "StrFactory.slice", parameters: [], returnType: AbiType.String, isDeclaredByUser: false });
    this.symbolTable.declareFunction("StrFactory.length", { name: "StrFactory.length", parameters: [], returnType: AbiType.Uint256, isDeclaredByUser: false });
    this.symbolTable.declareFunction("StrFactory.concat", { name: "StrFactory.concat", parameters: [], returnType: AbiType.String, isDeclaredByUser: false });

    // Address
    this.symbolTable.declareFunction("Address.copy", { name: "Address.copy", parameters: [], returnType: AbiType.Address, isDeclaredByUser: false });
    this.symbolTable.declareFunction("AddressFactory.create", { name: "AddressFactory.create", parameters: [], returnType: AbiType.Address, isDeclaredByUser: false });
    this.symbolTable.declareFunction("Address.fromString", { name: "Address.fromString", parameters: [], returnType: AbiType.Address, isDeclaredByUser: false });
    this.symbolTable.declareFunction("Address.equals", { name: "Address.equals", parameters: [], returnType: AbiType.Bool, isDeclaredByUser: false });
    this.symbolTable.declareFunction("Address.isZero", { name: "Address.isZero", parameters: [], returnType: AbiType.Bool, isDeclaredByUser: false });

    this.symbolTable.declareFunction("msg.sender", { name: "msg.sender", parameters: [], returnType: AbiType.Address, isDeclaredByUser: false });
  }

  getErrorManager(): ErrorManager {
    return this.errorManager;
  }

  getSymbolTable(): SymbolTableStack {
    return this.symbolTable;
  }
}