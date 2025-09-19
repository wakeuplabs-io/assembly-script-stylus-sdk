import { AbiType } from "./abi.types.js";
import { IRStruct } from "./ir.types.js";

// TODO: move to types folder
export type SymbolInfo =
  | (VariableSymbol & { scopeLevel: number })
  | (StructSymbol & { scopeLevel: number })
  | (FunctionSymbol & { scopeLevel: number });

export interface StructSymbol {
  name: string;
  type: AbiType.Struct;
  dynamicType?: string;
  metadata?: {
    fields: IRStruct["fields"];
    size: number;
    alignment: number;
  };
  scope: "storage";
}

export interface VariableSymbol {
  name: string;
  type: AbiType;
  dynamicType?: string;
  scope: "storage" | "memory";
  length?: number;
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
