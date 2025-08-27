import { AbiType } from "@/cli/types/abi.types.js";

import { EmitResult } from "../../../../types/emit.types.js";
import { IRStruct, IRContract, IRSimpleVar, IRExpression, Call } from "../../../../types/ir.types.js";
import { BaseTypeTransformer } from "../core/base-transformer.js";
import { StructFactoryCreateHandler } from "./handlers/factory-create-handler.js";
import { StructFieldAccessHandler } from "./handlers/field-access-handler.js";
import { StructFieldSetHandler } from "./handlers/field-set-handler.js";
import { ContractContext } from "../core/contract-context.js";
import { StructHelperCallHandler } from "./handlers/helper-call-handler.js";
import { StructPropertySetHandler } from "./handlers/property-set-handler.js";

export class StructTransformer extends BaseTypeTransformer {
  private structs: Map<string, IRStruct>;
  private fieldAccessHandler: StructFieldAccessHandler;
  private fieldSetHandler: StructFieldSetHandler;
  private factoryCreateHandler: StructFactoryCreateHandler;
  private helperCallHandler: StructHelperCallHandler;
  private propertySetHandler: StructPropertySetHandler;

  constructor(contractContext: ContractContext, structs: IRStruct[]) {
    super(contractContext, "Struct");
    
    this.structs = new Map(structs.map(s => [s.name, s]));
    this.fieldAccessHandler = new StructFieldAccessHandler(contractContext, this.structs);
    this.fieldSetHandler = new StructFieldSetHandler(contractContext, this.structs);
    this.factoryCreateHandler = new StructFactoryCreateHandler(contractContext, this.structs);
    this.helperCallHandler = new StructHelperCallHandler(contractContext, this.structs);
    this.propertySetHandler = new StructPropertySetHandler(contractContext, this.structs);
    
    // Registrar handlers
    this.registerHandler(this.fieldAccessHandler);
    this.registerHandler(this.fieldSetHandler);
    this.registerHandler(this.factoryCreateHandler);
    this.registerHandler(this.helperCallHandler);
    this.registerHandler(this.propertySetHandler);
  }

  canHandle(expr: IRExpression): boolean {
    if (!expr) return false;

    if (expr.kind === "call") {
      const target = expr.target || "";

      if (target === "StructFactory.create" && expr.metadata?.isStructCreation) {
        return true;
      }

      if (target.includes("_set_") || target.includes("_get_")) {
        const parts = target.split(/_(set|get)_/);
        if (parts.length >= 2) {
          const structName = parts[0];
          return this.structs.has(structName);
        }
      }

      if (expr.originalType && this.structs.has(expr.originalType)) {
        return true;
      }

      if (target === "property_set" && expr.args && expr.args.length === 3) {
        return true;
      }
    }

    if (expr.kind === "member") {
      if (expr.object?.kind === "this") {
        return false;
      }

      if (expr.object && expr.property) {
        const objectType = expr.object.type;
        if (objectType === "struct") {
          return true;
        }

        for (const struct of this.structs.values()) {
          if (struct.fields.some((field) => field.name === expr.property)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  protected handleDefault(expr: Call): EmitResult {
    const target = expr.target || "";
    
    // Handle specific getters
    if (target.includes("_get_")) {
      const parts = target.split("_get_");
      if (parts.length === 2) {
        const structName = parts[0];
        const fieldName = parts[1];
        const struct = this.structs.get(structName);
        
        if (struct && expr.args && expr.args.length === 1) {
          const objectArg = this.contractContext.emitExpression(expr.args[0]);
          
          return {
            setupLines: [...objectArg.setupLines],
            valueExpr: `${structName}_get_${fieldName}()`,
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
          const objectArg = this.contractContext.emitExpression(expr.args[0]);
          const valueArg = this.contractContext.emitExpression(expr.args[1]);
          
          return {
            setupLines: [
              ...objectArg.setupLines,
              ...valueArg.setupLines,
              `${structName}_set_${fieldName}(${objectArg.valueExpr}, ${valueArg.valueExpr});`,
            ],
            valueExpr: "/* void */",
            valueType: "void",
          };
        }
      }
    }

    return {
      setupLines: [],
      valueExpr: `/* Unsupported Struct expression: ${(expr as { kind?: string }).kind || "unknown"} */`,
      valueType: "usize",
    };
  }

  generateLoadCode(prop: string): string {
    return `load_${prop}()`;
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

  // Storage getters - for contract storage variables (like myStruct)
  struct.fields.forEach((field) => {
    const slotForField = baseSlot + Math.floor(field.offset / 32);
    const slotNumber = slotForField.toString(16).padStart(2, "0");

    if (field.type === AbiType.String || field.type === "Str") {
      // Special handling for strings - read directly from storage
      helpers.push(`
export function ${structName}_get_${field.name}(ptr: usize): usize {
  return Struct.getString(__SLOT${slotNumber});
}`);
    } else if (field.type === AbiType.Bool) {
      // Special handling for booleans - read directly from storage
      helpers.push(`
export function ${structName}_get_${field.name}(ptr: usize): usize {
  return Struct.getBoolean(__SLOT${slotNumber});
}`);
    } else if (field.type === AbiType.Uint256) {
      // Special handling for U256 - read directly from storage
      helpers.push(`
export function ${structName}_get_${field.name}(ptr: usize): usize {
  return Struct.getU256(__SLOT${slotNumber});
}`);
    } else {
      // For other types, use getField to get pointer to field location
      helpers.push(`
export function ${structName}_get_${field.name}(ptr: usize): usize {
  return Struct.getField(ptr, ${field.offset});
}`);
    }
  });

  // Memory getters - for temporary structs in memory
  struct.fields.forEach((field) => {
    helpers.push(`
export function ${structName}_memory_get_${field.name}(ptr: usize): usize {
  return load<usize>(ptr + ${field.offset});
}`);
  });

  // Storage setters - for contract storage variables (like myStruct)
  struct.fields.forEach((field) => {
    const slotForField = baseSlot + Math.floor(field.offset / 32);
    const slotNumber = slotForField.toString(16).padStart(2, "0");

    if (field.type === AbiType.Address) {
      helpers.push(`
export function ${structName}_set_${field.name}(ptr: usize, v: usize): void {
  Struct.setAddress(ptr + ${field.offset}, v, __SLOT${slotNumber});
}`);
    } else if (field.type === AbiType.String) {
      helpers.push(`
export function ${structName}_set_${field.name}(ptr: usize, v: usize): void {
  Struct.setString(ptr + ${field.offset}, v, __SLOT${slotNumber});
}`);
    } else if (field.type === AbiType.Uint256) {
      helpers.push(`
export function ${structName}_set_${field.name}(ptr: usize, v: usize): void {
  Struct.setU256(__SLOT${slotNumber}, v);
}`);
    } else if (field.type === AbiType.Bool) {
      helpers.push(`
export function ${structName}_set_${field.name}(ptr: usize, v: usize): void {
  Struct.setBoolean(__SLOT${slotNumber}, v);
}`);
    } else {
      // Generic fallback for other types
      helpers.push(`
export function ${structName}_set_${field.name}(ptr: usize, v: usize): void {
  store<usize>(ptr + ${field.offset}, v);
}`);
    }
  });

  // Memory setters - for temporary structs in memory
  struct.fields.forEach((field) => {
    helpers.push(`
export function ${structName}_memory_set_${field.name}(ptr: usize, v: usize): void {
  for (let i = 0; i < 32; i++) {
    store<u8>(ptr + ${field.offset} + i, load<u8>(v + i));
  }
}`);
  });

  return helpers;
}

/**
 * Generates struct-related code including slot constants and helpers
 */
export function registerStructTransformer(contract: IRContract): string[] {
  const parts: string[] = [];
  if (contract.structs && contract.structs.length > 0) {
    contract.structs.forEach((struct) => {
      const structVariable = contract.storage.find((v) => {
        if (v.kind === "simple") {
          const simpleVar = v as IRSimpleVar;
          return (
            simpleVar.originalType === struct.name ||
            (simpleVar.type === "struct" && simpleVar.originalType === struct.name)
          );
        }
        return false;
      }) as IRSimpleVar | undefined;

      if (structVariable) {
        const baseSlot = structVariable.slot;

        const existingSlots = new Set(contract.storage.map((v) => v.slot));

        const neededSlots = new Set<number>();

        const numSlots = Math.ceil(struct.size / 32);
        for (let i = 0; i < numSlots; i++) {
          neededSlots.add(baseSlot + i);
        }

        struct.fields.forEach((field) => {
          const fieldSlot = baseSlot + Math.floor(field.offset / 32);
          neededSlots.add(fieldSlot);
        });

        // Generate slot constants for all needed slots that don't exist
        const slotsToGenerate = Array.from(neededSlots)
          .filter((slot) => !existingSlots.has(slot))
          .sort((a, b) => a - b);

        slotsToGenerate.forEach((slotValue) => {
          const slotNumber = slotValue.toString(16).padStart(2, "0");
          parts.push(`const __SLOT${slotNumber}: u64 = ${slotValue};`);
        });

        if (slotsToGenerate.length > 0) {
          parts.push(""); // Add empty line after slot constants
        }

        parts.push(...generateStructHelpers(struct, baseSlot));
      } else {
        // Fallback if storage variable is not found
        parts.push(...generateStructHelpers(struct, 0));
      }
    });
  }

  return parts;
}
