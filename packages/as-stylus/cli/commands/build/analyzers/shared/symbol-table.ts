import { AbiType } from "@/cli/types/abi.types.js";
import { FunctionSymbol, SymbolInfo, SymbolTable, VariableSymbol } from "@/cli/types/symbol-table.types.js";

export class SymbolTableStack {
  private scopes: SymbolTable[] = [];
  private currentScope: number;
  
  constructor() {
    this.enterScope();
    this.currentScope = 0;
  }

  enterScope() {
    this.scopes.push(new Map());
    this.currentScope++;
  }

  exitScope() { 
    if (this.scopes.length <= 1) {
      throw new Error("Cannot exit global scope");
    }
    this.scopes.pop();
  }

  declareVariable(name: string, info: Omit<VariableSymbol, "scopeLevel">): boolean {  
    const current = this.scopes[this.scopes.length - 1];
    if (current.has(name)) return false;

    current.set(name, { ...info, scopeLevel: this.scopes.length - 1 }); 
    return true;
  }

  declareFunction(name: string, info: Omit<FunctionSymbol, "scopeLevel" | "type">): boolean {  
    const current = this.scopes[this.scopes.length - 1];
    if (current.has(name)) return false;
    
    current.set(name, { ...info, scopeLevel: this.scopes.length - 1, type: AbiType.Function });
    return true;
  }

  lookup(name: string): SymbolInfo | undefined {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const info = this.scopes[i].get(name);
      if (info) return info;
    }
    return undefined;
  }

  getCurrentScope(): SymbolTable {
    if (this.scopes.length === 0) {
      throw new Error("No active scope");
    }
    return this.scopes[this.scopes.length - 1];
  }

  toJSON() {
    return this.scopes.map(scope => {
      return {
        scopeLevel: scope.get("scopeLevel"),
        symbols: Array.from(scope.values())
      };
    });
  }
}
