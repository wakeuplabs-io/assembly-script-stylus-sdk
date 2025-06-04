export interface CompilationContext {
  slotMap: Map<string, number>;
}

export const ctx: CompilationContext = {
  slotMap: new Map(),
};
