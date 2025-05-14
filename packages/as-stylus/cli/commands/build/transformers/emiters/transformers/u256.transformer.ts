import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { TypeTransformer, registerTransformer } from "../types/transformers.js";

export const U256Transformer: TypeTransformer = {
  typeName: "U256",
  
  emit: (expr: any, context: EmitContext, emitExprFn: (expr: any, ctx: EmitContext) => EmitResult): EmitResult => {
    // U256Factory.create()
    if (expr.kind === "call" && expr.target === "U256Factory.create") {
      return { 
        setupLines: [], 
        valueExpr: "U256.create()",
        valueType: "U256"
      };
    }
    
    // U256Factory.fromString("1")
    if (expr.kind === "call" && expr.target === "U256Factory.fromString") {
      if (expr.args[0].kind !== "literal") {
        return { 
          setupLines: [], 
          valueExpr: "/* U256Factory.fromString: literal required */",
          valueType: "U256"
        };
      }
      
      const raw = expr.args[0].value as string;
      const strId = context.strCounter++;
      const mallocId = `__str${strId}`;
      const u256Id = `__u256${strId}`;
      
      const setupLines = [
        `const ${mallocId} = malloc(${raw.length});`
      ];
      
      for (let i = 0; i < raw.length; i++) {
        setupLines.push(`store<u8>(${mallocId} + ${i}, ${raw.charCodeAt(i)});`);
      }
      
      setupLines.push(
        `const ${u256Id}: usize = U256.create();`,
        `U256.setFromString(${u256Id}, ${mallocId}, ${raw.length});`
      );
      
      return {
        setupLines,
        valueExpr: u256Id,
        valueType: "U256"
      };
    }
    
    if (
      expr.kind === "call" &&
      (expr.target.endsWith(".add") || expr.target.endsWith(".sub"))
    ) {
      const [cls, prop, op] = expr.target.split(".");
      if (cls === context.contractName && (op === "add" || op === "sub")) {
        const argRes = emitExprFn(expr.args[0], context);
    
        return {
          setupLines: [...argRes.setupLines],
          valueExpr: `U256.${op}(load_${prop}(), ${argRes.valueExpr})`,
          valueType: "U256"
        };
      }
    }

    if (expr.kind === "call" && expr.target.includes(".")) {
      const target = expr.target;
      const parts = target.split(".");  // ["Counter","counter","add"]
      const methodName = parts[parts.length - 1];
      
      if (methodName === "add" || methodName === "sub" || methodName === "toString") {
        if (parts[0] === context.contractName && parts.length >= 3) {
          const property = parts[1];
          
          if (methodName === "add" || methodName === "sub") {
            const argResult = emitExprFn(expr.args[0], context);
            const result = {
              setupLines: [...argResult.setupLines],
              valueExpr: `U256.${methodName}(load_${property}(), ${argResult.valueExpr})`,
              valueType: "U256"
            };
            return result;
          }
          
          if (methodName === "toString" && expr.args.length === 0) {
            return {
              setupLines: [],
              valueExpr: `load_${property}()`,
              valueType: "U256"
            };
          }
        }
        
        // Llamada de método genérica
        const targetObj = target.substring(0, target.lastIndexOf('.'));
        const objResult = emitExprFn({ kind: "var", name: targetObj }, context);
        
        const argResults = expr.args.map((arg: any) => emitExprFn(arg, context));
        const setupLines: string[] = [...objResult.setupLines];
        
        // Agregar setupLines de todos los argumentos
        for (const argResult of argResults) {
          setupLines.push(...argResult.setupLines);
        }
        
        return {
          setupLines,
          valueExpr: `${objResult.valueExpr}.${methodName}(${argResults.map((r: EmitResult) => r.valueExpr).join(", ")})`,
          valueType: "U256"
        };
      }
    }
    
    // Si llegamos aquí, no podemos manejar la expresión
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported U256 expression: ${expr.kind} */`,
      valueType: "U256"
    };
  },
  
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

  generateLoadCode: (property: string): string => {
    return `load_${property}()`;
  },
  
  generateStoreCode: (property: string, valueExpr: string): string => {
    return `store_${property}(${valueExpr});`;
  }
};

// Registrar el transformador
registerTransformer(U256Transformer);
