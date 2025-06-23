import { EmitResult, EmitContext } from "../../../../types/emit.types.js";
import { IRStruct } from "../../../../types/ir.types.js";
import { BaseTypeTransformer } from "../core/base-transformer.js";
import { StructCreateHandler } from "./handlers/create-handler.js";
import { StructFieldAccessHandler } from "./handlers/field-access-handler.js";

export class StructTransformer extends BaseTypeTransformer {
  private structs: Map<string, IRStruct>;
  private createHandler: StructCreateHandler;
  private fieldAccessHandler: StructFieldAccessHandler;

  constructor(structs: IRStruct[]) {
    super("Struct");
    
    this.structs = new Map(structs.map(s => [s.name, s]));
    this.createHandler = new StructCreateHandler(this.structs);
    this.fieldAccessHandler = new StructFieldAccessHandler(this.structs);
    
    // Registrar handlers
    this.registerHandler(this.createHandler);
    this.registerHandler(this.fieldAccessHandler);
  }

  matchesType(expr: any): boolean {
    if (!expr || expr.kind !== "call") return false;
    
    const target = expr.target || "";
    
    // Detect struct creation: new StructName()
    if (target.startsWith("new ") && target.endsWith("()")) {
      const structName = target.slice(4, -2);
      return this.structs.has(structName);
    }
    
    // Detect setter calls: StructName_set_field
    if (target.includes("_set_")) {
      const parts = target.split("_set_");
      if (parts.length === 2) {
        const structName = parts[0];
        return this.structs.has(structName);
      }
    }
    
    // Detect getter calls: StructName_get_field
    if (target.includes("_get_")) {
      const parts = target.split("_get_");
      if (parts.length === 2) {
        const structName = parts[0];
        return this.structs.has(structName);
      }
    }
    
    return false;
  }

  protected handleDefault(
    expr: any, 
    context: EmitContext, 
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const target = expr.target || "";
    
    // Handle specific getters
    if (target.includes("_get_")) {
      const parts = target.split("_get_");
      if (parts.length === 2) {
        const structName = parts[0];
        const fieldName = parts[1];
        const struct = this.structs.get(structName);
        
        if (struct && expr.args && expr.args.length === 1) {
          const objectArg = emitExprFn(expr.args[0], context);
          
          return {
            setupLines: [...objectArg.setupLines],
            valueExpr: `${structName}_get_${fieldName}(${objectArg.valueExpr})`,
            valueType: "usize"
          };
        }
      }
    }
    
    // Handle specific setters
    if (target.includes("_set_")) {
      const parts = target.split("_set_");
      if (parts.length === 2) {
        const structName = parts[0];
        const fieldName = parts[1];
        const struct = this.structs.get(structName);
        
        if (struct && expr.args && expr.args.length === 2) {
          const objectArg = emitExprFn(expr.args[0], context);
          const valueArg = emitExprFn(expr.args[1], context);
          
          return {
            setupLines: [
              ...objectArg.setupLines,
              ...valueArg.setupLines,
              `${structName}_set_${fieldName}(${objectArg.valueExpr}, ${valueArg.valueExpr});`
            ],
            valueExpr: "/* void */",
            valueType: "void"
          };
        }
      }
    }

    return {
      setupLines: [],
      valueExpr: `/* Unsupported Struct expression: ${expr.kind} */`,
      valueType: "usize"
    };
  }

  generateLoadCode(prop: string): string {
    return `load_${prop}()`;
  }

  generateStoreCode(prop: string, val: string): string {
    return `store_${prop}(${val});`;
  }
}

/**
 * Generates AssemblyScript helpers for a struct
 */
export function generateStructHelpers(struct: IRStruct): string[] {
  const helpers: string[] = [];
  const structName = struct.name;
  
  // Allocation helper
  helpers.push(`
export function ${structName}_alloc(): usize {
  const ptr: usize = malloc(${struct.size});
  memory.fill(ptr, 0, ${struct.size}); // Zero-init
  return ptr;
}`);

  // Copy helper
  helpers.push(`
export function ${structName}_copy(dst: usize, src: usize): void {
  memory.copy(dst, src, ${struct.size});
}`);

  // Getters for each field
  struct.fields.forEach(field => {
    if (field.dynamic) {
      // For dynamic fields, return the pointer
      helpers.push(`
export function ${structName}_get_${field.name}(ptr: usize): usize {
  return load<usize>(ptr + ${field.offset});
}`);
    } else {
      // For static fields, load the value directly
      helpers.push(`
export function ${structName}_get_${field.name}(ptr: usize): usize {
  return load<usize>(ptr + ${field.offset});
}`);
    }
  });

  // Setters for each field
  struct.fields.forEach(field => {
    helpers.push(`
export function ${structName}_set_${field.name}(ptr: usize, value: usize): void {
  store<usize>(ptr + ${field.offset}, value);
}`);
  });

  return helpers;
} 