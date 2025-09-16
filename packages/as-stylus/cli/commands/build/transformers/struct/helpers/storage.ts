import { AbiType } from "@/cli/types/abi.types.js";
import { IRStruct } from "@/cli/types/ir.types.js";

// Template constants for better indentation control
const SETTER_TEMPLATES = {
  ADDRESS: (name: string, fieldName: string) => `
export function ${name}_set_${fieldName}(slot: u64, v: usize): void {
  Struct.setAddress(slot, v);
}`,

  STRING: (name: string, fieldName: string) => `
export function ${name}_set_${fieldName}(slot: u64, v: usize): void {
  Struct.setString(slot, v);
}`,

  UINT256: (name: string, fieldName: string) => `
export function ${name}_set_${fieldName}(slot: u64, v: usize): void {
  Struct.setU256(slot, v);
}`,

  BOOL: (name: string, fieldName: string) => `
export function ${name}_set_${fieldName}(slot: u64, v: boolean): void {
  Struct.setBoolean(slot, Boolean.create(v));
}`,

  GENERIC: (name: string, fieldName: string) => `
export function ${name}_set_${fieldName}(slot: u64, v: usize): void {
  store<usize>(slot, v);
}`,
};

const GETTER_TEMPLATES = {
  STRING: (name: string, fieldName: string) => `
export function ${name}_get_${fieldName}(slot: u64): usize {
  return Struct.getString(slot);
}`,

  UINT256: (name: string, fieldName: string) => `
export function ${name}_get_${fieldName}(slot: u64): usize {
  return Struct.getU256(slot);
}`,

  BOOL: (name: string, fieldName: string) => `
export function ${name}_get_${fieldName}(slot: u64): boolean {
  return Struct.getBoolean(slot);
}`,

  ADDRESS: (name: string, fieldName: string) => `
export function ${name}_get_${fieldName}(slot: u64): usize {
  return Struct.getAddress(slot);
}`,

  GENERIC: (name: string, fieldName: string) => `
export function ${name}_get_${fieldName}(slot: u64): usize {
  return Struct.getAddress(slot);
}`,
};

/**
 * Generates storage setter functions for struct fields
 * Creates functions that can set values on contract storage variables
 *
 * @param struct - The struct definition containing field information
 * @param baseSlot - The base storage slot for this struct
 * @param structName - Name of the struct (derived from struct.name if not provided)
 */
export function generateStorageSetters(
  struct: IRStruct,
  baseSlot: number,
  structName?: string,
): string[] {
  const name = structName || struct.name;
  const helpers: string[] = [];

  // Storage setters - for contract storage variables (like myStruct)
  struct.fields.forEach((field) => {
    let template: string;

    switch (field.type) {
      case AbiType.Address:
        template = SETTER_TEMPLATES.ADDRESS(name, field.name);
        break;
      case AbiType.String:
        template = SETTER_TEMPLATES.STRING(name, field.name);
        break;
      case AbiType.Uint256:
        template = SETTER_TEMPLATES.UINT256(name, field.name);
        break;
      case AbiType.Bool:
        template = SETTER_TEMPLATES.BOOL(name, field.name);
        break;
      default:
        template = SETTER_TEMPLATES.GENERIC(name, field.name);
        break;
    }

    helpers.push(template);
  });

  return helpers;
}

/**
 * Generates storage getter functions for struct fields
 * Creates functions that can retrieve values from contract storage variables
 *
 * @param struct - The struct definition containing field information
 * @param baseSlot - The base storage slot for this struct
 * @param structName - Name of the struct (derived from struct.name if not provided)
 */
export function generateStorageGetters(struct: IRStruct, structName?: string): string[] {
  const name = structName || struct.name;
  const helpers: string[] = [];

  // Storage getters - for contract storage variables (like myStruct)
  struct.fields.forEach((field) => {
    let template: string;

    switch (field.type) {
      case AbiType.Address:
        template = GETTER_TEMPLATES.GENERIC(name, field.name);
        break;
      case AbiType.String:
        template = GETTER_TEMPLATES.STRING(name, field.name);
        break;
      case AbiType.Uint256:
        template = GETTER_TEMPLATES.UINT256(name, field.name);
        break;
      case AbiType.Bool:
        template = GETTER_TEMPLATES.BOOL(name, field.name);
        break;
      default:
        template = GETTER_TEMPLATES.GENERIC(name, field.name);
        break;
    }

    helpers.push(template);
  });

  return helpers;
}
