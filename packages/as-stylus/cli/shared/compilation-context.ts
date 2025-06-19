import { IREvent } from "../types/ir.types.js";

export interface CompilationContext {
  slotMap: Map<string, number>;
  eventMap: Map<string, IREvent>;
}

export const ctx: CompilationContext = {
  slotMap: new Map(),
  eventMap: new Map(),
};
