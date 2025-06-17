// TODO: move to types folder
export type SymbolInfo =
  | (VariableSymbol & { scopeLevel: number })
  | (FunctionSymbol & { scopeLevel: number });

export interface VariableSymbol {
  name: string;
  type: string;
  scope: "storage" | "memory";
}

export interface FunctionSymbol {
  name: string;
  type: "function";
  returnType: string;
  parameters: { name: string; type: string }[];
  scope?: undefined;
}

export type SymbolTable = Map<string, SymbolInfo>;
