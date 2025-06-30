import { IREvent, IRStruct } from "../types/ir.types.js";

export interface CompilationContext {
  slotMap: Map<string, number>;
  eventMap: Map<string, IREvent>;
  structRegistry: Map<string, IRStruct>;
  variableTypes: Map<string, string>;
  contractName: string;
}

export const ctx: CompilationContext = {
  slotMap: new Map(),
  eventMap: new Map(),
  structRegistry: new Map(),
  variableTypes: new Map(),
  contractName: "",
};
