import { AbiType } from "./abi.types.js";

// TODO: move to types folder
export type SymbolInfo =
  | (VariableSymbol & { scopeLevel: number })
  | (FunctionSymbol & { scopeLevel: number });

export interface VariableSymbol {
  name: string;
  type: AbiType;
  dynamicType?: string;
  scope: "storage" | "memory";
}

export interface FunctionSymbol {
  name: string;
  type: AbiType.Function | AbiType.UserDefinedFunction;
  isDeclaredByUser: boolean;
  returnType: AbiType;
  dynamicType?: string;
  parameters: { name: string; type: AbiType }[];
  scope?: undefined;
}

export type SymbolTable = Map<string, SymbolInfo>;
