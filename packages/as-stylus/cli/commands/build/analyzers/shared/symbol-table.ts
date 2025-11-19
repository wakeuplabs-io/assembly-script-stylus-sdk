import { AbiType } from "@/cli/types/abi.types.js";
import { IRStruct } from "@/cli/types/ir.types.js";
import {
  FunctionSymbol,
  SymbolInfo,
  SymbolTable,
  VariableSymbol,
} from "@/cli/types/symbol-table.types.js";

import { SlotManager } from "./slot-manager.js";

export class SymbolTableStack {
  private structTemplates: Map<string, IRStruct> = new Map();
  private types: Set<AbiType> = new Set();
  private scopes: SymbolTable[] = [];
  private currentScope: number;
  private slotManager: SlotManager;

  constructor(slotManager: SlotManager) {
    this.enterScope();
    this.currentScope = 0;
    this.slotManager = slotManager;
  }

  enterScope() {
    this.scopes.push(new Map());
    this.currentScope++;
  }

  getTypes(): Set<AbiType> {
    return this.types;
  }

  exitScope() {
    if (this.scopes.length <= 1) {
      throw new Error("Cannot exit global scope");
    }
    this.scopes.pop();
    this.currentScope--;
  } 

  declareStruct(name: string, info: IRStruct): boolean {
    const current = this.scopes[0];
    if (current.has(name)) return false;
    this.types.add(AbiType.Struct);
    this.structTemplates.set(name, info);
    return true;
  }

  declareVariable(name: string, info: Omit<VariableSymbol, "scopeLevel">): boolean {
    const current = this.scopes[this.scopes.length - 1];
    const scopeLevel = this.scopes.length - 1;
    if (current.has(name)) return false;

    const isConstant = info.scope === "memory" && scopeLevel === 0;

    this.types.add(info.type);
    current.set(name, { ...info, scopeLevel, isConstant });

    if (info.scope === "storage") {
      let fields = info.length ?? 1;
      if (info.type === AbiType.Struct) {
        const structTemplate = this.getStructTemplateByName(info.dynamicType!);
        fields = structTemplate?.fields.length ?? 1;
      }
      this.slotManager.allocateSlot(name, {
        type: info.type,
        dynamicType: info.dynamicType,
        length: fields,
      });
    }

    return true;
  }

  declareFunction(name: string, info: Omit<FunctionSymbol, "scopeLevel" | "type">): boolean {
    const current = this.scopes[this.scopes.length - 1];
    if (current.has(name)) return false;

    this.types.add(info.returnType);
    current.set(name, { ...info, scopeLevel: this.scopes.length - 1, type: AbiType.Function });
    return true;
  }

  getStructTemplateByName(name: string): IRStruct | undefined {
    return this.structTemplates.get(name);
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

  merge(other: SymbolTableStack) {
    for (let i = 0; i < other.scopes.length; i++) {
      const scope = other.scopes[i];
      for (const [name, symbol] of scope) {
        if (this.lookup(name)) {
          continue;
        }
        this.types.add(symbol.type);
        this.scopes[i].set(name, symbol);
      }
    }
  }

  toJSON() {
    return this.scopes.map((scope) => {
      return {
        scopeLevel: scope.get("scopeLevel"),
        symbols: Array.from(scope.values()),
      };
    });
  }
}
