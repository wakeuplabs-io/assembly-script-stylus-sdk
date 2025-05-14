export interface EmitContext {
  isInStatement: boolean;
  contractName: string;
  strCounter: number;
  ptrCounter: number;
}

export interface TypeTransformer {
  typeName: string;
  
  matchesType: (expr: any) => boolean;
  
  emitCreateExpression: (args: any[], context: EmitContext) => string;
  emitFromStringExpression: (stringArg: any, context: EmitContext) => string;
  
  canHandleMethodCall: (methodName: string, target: string) => boolean;
  emitMethodCall: (methodName: string, target: string, args: any[], context: EmitContext, emitExprFn: (expr: any, ctx: EmitContext) => string) => string;
  
  generateLoadCode: (property: string) => string;
  generateStoreCode: (property: string, valueExpr: string) => string;
}

export const typeTransformers: Record<string, TypeTransformer> = {};

export function registerTransformer(transformer: TypeTransformer): void {
  typeTransformers[transformer.typeName] = transformer;
}

/**
 * Detects the most probable type of an expression by consulting all registered transformers.
 * If no transformer matches, applies a fallback logic for certain "call" expressions:
 *   - If the expression is a factory call (e.g., "U256Factory.create"), it infers the type from the factory name.
 *   - If any transformer can handle the method call (via canHandleMethodCall), it returns that type.
 * If neither the transformers nor the fallback logic match, returns null (default case).
 * 
 * @param expr - The IR expression to analyze.
 * @returns The type name if detected, or null if no transformer or fallback matches.
 */
export function detectExpressionType(expr: any): string | null {
  for (const typeName in typeTransformers) {
    if (typeTransformers[typeName].matchesType(expr)) {
      return typeName;
    }
  }
  
  if (expr.kind === "call") {
    const target = expr.target || "";
    
    if (target.endsWith("Factory.create") || target.endsWith("Factory.fromString")) {
      const typeName = target.split("Factory.")[0];
      return typeName;
    }
    
    for (const typeName in typeTransformers) {
      if (typeTransformers[typeName].canHandleMethodCall("", target)) {
        return typeName;
      }
    }
  }

  return null;
}
