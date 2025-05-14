import { TypeTransformer, EmitContext, registerTransformer } from "../types/transformers.js";

export const U256Transformer: TypeTransformer = {
  typeName: "U256",
  
  matchesType: (expr: any): boolean => {
    // Verificar si esta expresión es de tipo U256
    if (expr.kind === "call") {
      const target = expr.target || "";
      
      if (target === "U256Factory.create" || target === "U256Factory.fromString") {
        return true;
      }
      
      // Métodos propios de U256
      if (target.endsWith(".add") || target.endsWith(".sub") || target.endsWith(".toString")) {
        return true;
      }
    }
    
    return false;
  },
  
  emitCreateExpression: (): string => {
    return "U256.create()";
  },
  
  emitFromStringExpression: (stringArg: any, context: EmitContext): string => {
    if (stringArg.kind !== "literal") {
      return "/* U256Factory.fromString: literal required */";
    }

    const raw = stringArg.value as string;
    const strId = context.strCounter++;
    const mallocId = `__str${strId}`;
    const u256Id = `__u256${strId}`;

    if (context.isInStatement) return u256Id;

    const code: string[] = [
      "(() => {",
      `  const ${mallocId} = malloc(${raw.length});`,
    ];
    
    for (let i = 0; i < raw.length; i++) {
      code.push(`  store<u8>(${mallocId} + ${i}, ${raw.charCodeAt(i)});`);
    }
    
    code.push(
      `  const ${u256Id}: usize = U256.create();`,
      `  U256.setFromString(${u256Id}, ${mallocId}, ${raw.length});`,
      `  return ${u256Id};`,
      "})()"
    );
    
    return code.join("\n");
  },
  
  canHandleMethodCall: (methodName: string, target: string): boolean => {
    // Verificar si esta llamada a método es para U256
    if (target.endsWith(".add") || target.endsWith(".sub") || target.endsWith(".toString")) {
      const parts = target.split(".");
      if (parts.length >= 3) {
        // Verificar si el objeto es una propiedad del contrato
        return true;
      }
    }
    
    return false;
  },
  
  emitMethodCall: (methodName: string, target: string, args: any[], context: EmitContext, emitExprFn: (expr: any, ctx: EmitContext) => string): string => {
    const parts = target.split(".");  // ["Counter","counter","add"]
    const operation = methodName;     // "add", "sub", "toString"
    
    if (parts[0] === context.contractName && parts.length >= 3) {
      const property = parts[1];      // "counter"
      
      if (operation === "add" || operation === "sub") {
        // Generar código para add/sub que operan sobre propiedades del contrato
        const left = `load_${property}()`;
        const right = emitExprFn(args[0], context);
        return `U256.${operation}(${left}, ${right})`;
      }
      
      if (operation === "toString" && args.length === 0) {
        // Caso especial para toString() en propiedades del contrato
        return `load_${property}()`;
      }
    }
    
    // Cualquier otra llamada de método genérica
    const targetObj = target.substring(0, target.lastIndexOf('.'));
    const obj = emitExprFn({ kind: "var", name: targetObj }, context);
    const argsStr = args.map(arg => emitExprFn(arg, context)).join(", ");
    return `${obj}.${operation}(${argsStr})`;
  },
  
  generateLoadCode: (property: string): string => {
    return `load_${property}()`;
  },
  
  generateStoreCode: (property: string, valueExpr: string): string => {
    return `store_${property}(${valueExpr});`;
  }
};

// Registrar el transformador
registerTransformer(U256Transformer);
