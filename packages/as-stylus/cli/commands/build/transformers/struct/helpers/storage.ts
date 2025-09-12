import { AbiType } from "@/cli/types/abi.types.js";
import { IRStruct } from "@/cli/types/ir.types.js";

// Template constants for better indentation control
const SETTER_TEMPLATES = {
  ADDRESS: (name: string, fieldName: string, offset: number, slotNumber: string) => `
export function ${name}_set_${fieldName}(ptr: usize, v: usize): void {
  Struct.setAddress(ptr + ${offset}, v, __SLOT${slotNumber});

}`,

  STRING: (name: string, fieldName: string, offset: number, slotNumber: string) => `
export function ${name}_set_${fieldName}(ptr: usize, v: usize): void {
  Struct.setString(ptr + ${offset}, v, __SLOT${slotNumber});
}`,

  UINT256: (name: string, fieldName: string, slotNumber: string) => `
export function ${name}_set_${fieldName}(ptr: usize, v: usize): void {
  Struct.setU256(__SLOT${slotNumber}, v);
}`,

  BOOL: (name: string, fieldName: string, slotNumber: string) => `
export function ${name}_set_${fieldName}(ptr: usize, v: boolean): void {
  Struct.setBoolean(__SLOT${slotNumber}, Boolean.create(v));
}`,

  GENERIC: (name: string, fieldName: string, offset: number, _slotNumber: string) => `
export function ${name}_set_${fieldName}(ptr: usize, v: usize): void {
  store<usize>(ptr + ${offset}, v);
}`
};

const GETTER_TEMPLATES = {
  STRING: (name: string, fieldName: string, offset: number, slotNumber: string) => `
export function ${name}_get_${fieldName}(ptr: usize): usize {
  return Struct.getString(__SLOT${slotNumber});
}`,

  UINT256: (name: string, fieldName: string, slotNumber: string) => `
export function ${name}_get_${fieldName}(_ptr: usize): usize {
  return Struct.getU256(__SLOT${slotNumber});
}`,

  BOOL: (name: string, fieldName: string, slotNumber: string) => `
export function ${name}_get_${fieldName}(_ptr: usize): boolean {
  return Struct.getBoolean(__SLOT${slotNumber});
}`,

  ADDRESS: (name: string, fieldName: string, slotNumber: string) => `
export function ${name}_get_${fieldName}(_ptr: usize): usize {
  return Struct.getAddress(__SLOT${slotNumber});
}`,

  GENERIC: (name: string, fieldName: string, slotNumber: string) => `
export function ${name}_get_${fieldName}(ptr: usize): usize {
  return Struct.getAddress(__SLOT${slotNumber});
}`
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
  structName?: string
): string[] {
  const name = structName || struct.name;
  const helpers: string[] = [];

  // Storage setters - for contract storage variables (like myStruct)
  struct.fields.forEach((field) => {
    const slotForField = baseSlot + Math.floor(field.offset / 32);
    const slotNumber = slotForField.toString(16).padStart(2, "0");

    let template: string;

    switch (field.type) {
      case AbiType.Address:
        template = SETTER_TEMPLATES.ADDRESS(name, field.name, field.offset, slotNumber);
        break;
      case AbiType.String:
        template = SETTER_TEMPLATES.STRING(name, field.name, field.offset, slotNumber);
        break;
      case AbiType.Uint256:
        template = SETTER_TEMPLATES.UINT256(name, field.name, slotNumber);
        break;
      case AbiType.Bool:
        template = SETTER_TEMPLATES.BOOL(name, field.name, slotNumber);
        break;
      default:
        template = SETTER_TEMPLATES.GENERIC(name, field.name, field.offset, slotNumber);
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
export function generateStorageGetters(
  struct: IRStruct,
  baseSlot: number,
  structName?: string
): string[] {
  const name = structName || struct.name;
  const helpers: string[] = [];

  // Storage getters - for contract storage variables (like myStruct)
  struct.fields.forEach((field) => {
    const slotForField = baseSlot + Math.floor(field.offset / 32);
    const slotNumber = slotForField.toString(16).padStart(2, "0");

    let template: string;

    switch (field.type) {
      case AbiType.Address:
        template = GETTER_TEMPLATES.GENERIC(name, field.name, slotNumber);
        break;
      case AbiType.String:
        template = GETTER_TEMPLATES.STRING(name, field.name, field.offset, slotNumber);
        break;
      case AbiType.Uint256:
        template = GETTER_TEMPLATES.UINT256(name, field.name, slotNumber);
        break;
      case AbiType.Bool:
        template = GETTER_TEMPLATES.BOOL(name, field.name, slotNumber);
        break;
      default:
        template = GETTER_TEMPLATES.GENERIC(name, field.name, slotNumber);
        break;
    }

    helpers.push(template);
  });

  return helpers;
}
