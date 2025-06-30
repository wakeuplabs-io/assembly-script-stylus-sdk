import { EmitResult, EmitContext } from "../../../../types/emit.types.js";
import { IRStruct, IRContract } from "../../../../types/ir.types.js";
import { BaseTypeTransformer } from "../core/base-transformer.js";
import { StructFactoryCreateHandler } from "./handlers/factory-create-handler.js";
import { StructFieldAccessHandler } from "./handlers/field-access-handler.js";
import { StructFieldSetHandler } from "./handlers/field-set-handler.js";

export class StructTransformer extends BaseTypeTransformer {
  private structs: Map<string, IRStruct>;
  private fieldAccessHandler: StructFieldAccessHandler;
  private fieldSetHandler: StructFieldSetHandler;
  private factoryCreateHandler: StructFactoryCreateHandler;

  constructor(structs: IRStruct[]) {
    super("Struct");
    
    this.structs = new Map(structs.map(s => [s.name, s]));
    this.fieldAccessHandler = new StructFieldAccessHandler(this.structs);
    this.fieldSetHandler = new StructFieldSetHandler(this.structs);
    this.factoryCreateHandler = new StructFactoryCreateHandler(this.structs);
    
    // Registrar handlers
    this.registerHandler(this.fieldAccessHandler);
    this.registerHandler(this.fieldSetHandler);
    this.registerHandler(this.factoryCreateHandler);
  }

  matchesType(expr: any): boolean {
    if (!expr || expr.kind !== "call") return false;
    
    const target = expr.target || "";
    
    if (target === "StructFactory.create" && expr.metadata?.isStructCreation) {
      return true;
    }
    
    if (target.includes("_set_")) {
      const parts = target.split("_set_");
      if (parts.length === 2) {
        const structName = parts[0];
        return this.structs.has(structName);
      }
    }
    
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
export function generateStructHelpers(struct: IRStruct, baseSlot: number): string[] {
  const helpers: string[] = [];
  const structName = struct.name;
  
  // Allocation helper using Struct.alloc
  helpers.push(`
export function ${structName}_alloc(): usize {
  return Struct.alloc(${struct.size});
}`);

  // Copy helper using Struct.copy
  helpers.push(`
export function ${structName}_copy(dst: usize, src: usize): void {
  Struct.copy(dst, src, ${struct.size});
}`);

  // Getters for each field using appropriate Struct methods
  struct.fields.forEach(field => {
    const slotForField = baseSlot + Math.floor(field.offset / 32);
    const slotNumber = slotForField.toString(16).padStart(2, "0");
    
    if (field.type === "string" || field.type === "Str") {
      // Special handling for strings - read directly from storage
      helpers.push(`
export function ${structName}_get_${field.name}(ptr: usize): usize {
  return Struct.getString(__SLOT${slotNumber});
}`);
    } else if (field.type === "boolean") {
      // Special handling for booleans - use Boolean.copyNew to return 1-byte value
      helpers.push(`
export function ${structName}_get_${field.name}(ptr: usize): usize {
  return Boolean.copyNew(ptr + ${field.offset});
}`);
    } else {
      // For other types, use getField to get pointer to field location
      helpers.push(`
export function ${structName}_get_${field.name}(ptr: usize): usize {
  return Struct.getField(ptr, ${field.offset});
}`);
    }
  });

  // Setters for each field using type-specific Struct methods
  struct.fields.forEach(field => {
    const slotForField = baseSlot + Math.floor(field.offset / 32);
    const slotNumber = slotForField.toString(16).padStart(2, "0");
    
    if (field.type === "Address") {
      helpers.push(`
export function ${structName}_set_${field.name}(ptr: usize, v: usize): void {
  Struct.setAddress(ptr + ${field.offset}, v, __SLOT${slotNumber});
  Struct.flushStorage();
}`);
    } else if (field.type === "string" || field.type === "Str") {
      helpers.push(`
export function ${structName}_set_${field.name}(ptr: usize, v: usize): void {
  Struct.setString(ptr + ${field.offset}, v, __SLOT${slotNumber});
  Struct.flushStorage();
}`);
    } else if (field.type === "U256") {
      helpers.push(`
export function ${structName}_set_${field.name}(ptr: usize, v: usize): void {
  Struct.setU256(ptr + ${field.offset}, v, __SLOT${slotNumber});
  Struct.flushStorage();
}`);
    } else if (field.type === "boolean") {
      helpers.push(`
export function ${structName}_set_${field.name}(ptr: usize, v: usize): void {
  const boolValue = load<u8>(v);
  Struct.setBoolean(ptr + ${field.offset}, boolValue != 0, __SLOT${slotNumber});
  Struct.flushStorage();
}`);
    } else {
      // Generic fallback for other types
      helpers.push(`
export function ${structName}_set_${field.name}(ptr: usize, v: usize): void {
  store<usize>(ptr + ${field.offset}, v);
  Struct.flushStorage();
}`);
    }
  });

  return helpers;
}

/**
 * Generates struct-related code including slot constants and helpers
 */
export function registerStructTransformer(contract: IRContract): string[] {
  const parts: string[] = [];
  
  if (contract.structs && contract.structs.length > 0) {
    contract.structs.forEach(struct => {
      const structVariable = contract.storage.find(v => 
        v.type === struct.name && v.kind === "simple"
      );
      
      if (structVariable) {
        const baseSlot = structVariable.slot;
        
        const existingSlots = new Set(contract.storage.map(v => v.slot));
        const numSlots = Math.ceil(struct.size / 32);
        
        for (let i = 0; i < numSlots; i++) {
          const slotValue = baseSlot + i;
          if (!existingSlots.has(slotValue)) {
            const slotNumber = slotValue.toString(16).padStart(2, "0");
            parts.push(`const __SLOT${slotNumber}: u64 = ${slotValue};`);
          }
        }
        if (numSlots > 1) {
          parts.push(''); // Add empty line after slot constants only if we added some
        }
        
        parts.push(...generateStructHelpers(struct, baseSlot));
      } else {
        // Fallback si no se encuentra la variable de storage
        parts.push(...generateStructHelpers(struct, 0));
      }
    });
  }
  
  return parts;
} 