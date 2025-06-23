// TODO: move to types folder
export type SymbolInfo =
  | (VariableSymbol & { scopeLevel: number })
  | (FunctionSymbol & { scopeLevel: number });

export interface VariableSymbol {
  name: string;
  type: string;
}

export interface FunctionSymbol {
  name: string;
  type: "function";
  returnType: string;
  parameters: { name: string; type: string }[];
}

export type SymbolTable = Map<string, SymbolInfo>;
