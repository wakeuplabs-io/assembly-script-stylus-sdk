import { IREvent } from "../types/ir.types.js";

export interface CompilationContext {
  eventMap: Map<string, IREvent>;
  variableTypes: Map<string, string>;
  mappingTypes: Map<
    string,
    {
      keyType?: string;
      valueType?: string;
      keyType1?: string;
      keyType2?: string;
    }
  >;
  contractName: string;
}

export const ctx: CompilationContext = {
  eventMap: new Map(),
  variableTypes: new Map(),
  mappingTypes: new Map(),
  contractName: "",
};
