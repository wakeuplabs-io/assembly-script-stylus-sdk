import { AbiType } from "@/cli/types/abi.types.js";
import { IRStruct } from "@/cli/types/ir.types.js";

const ALLOCS_TEMPLATES = {
  static: (name: string, size: number) => `
export function ${name}_memory_alloc(): usize {
  const ptr = Struct.alloc(${size});
  return ptr;
}`,
};

const MEMORY_GETTER_TEMPLATES = {
  BOOL: (name: string, fieldName: string, offset: number) => `
export function ${name}_memory_get_${fieldName}(ptr: usize): boolean {
  return StructMemory.getBoolean(ptr, ${offset});
}`,

  STRING: (name: string, fieldName: string, fieldOffset: number) => `
export function ${name}_memory_get_${fieldName}(ptr: usize): usize {
  return StructMemory.getString(ptr, ${fieldOffset});
}`,

  GENERIC: (name: string, fieldName: string, offset: number) => `
export function ${name}_memory_get_${fieldName}(ptr: usize): usize {
  return StructMemory.getField(ptr, ${offset});
}`,
};

const MEMORY_SETTER_TEMPLATES = {
  STRING: (name: string, fieldName: string, fieldOffset: number) => `
export function ${name}_memory_set_${fieldName}(ptr: usize, v: usize): void {
  StructMemory.setString(ptr, ${fieldOffset}, v);
}`,

  GENERIC: (name: string, fieldName: string, fieldOffset: number) => `
export function ${name}_memory_set_${fieldName}(ptr: usize, v: usize): void {
  StructMemory.setField(ptr, ${fieldOffset}, v);
}`,
};

/**
 * Generates memory allocation function for struct
 * Creates a function that allocates memory for a struct instance
 *
 * @param struct - The struct definition containing field information
 * @param structName - Name of the struct (derived from struct.name if not provided)
 */
export function generateMemoryAlloc(struct: IRStruct, structName?: string): string {
  const name = structName || struct.name;

  return ALLOCS_TEMPLATES.static(name, struct.size);
}

/**
 * Generates memory getter functions for struct fields
 * Creates functions that can retrieve values from memory struct instances
 *
 * @param struct - The struct definition containing field information
 * @param structName - Name of the struct (derived from struct.name if not provided)
 */
export function generateMemoryGetters(struct: IRStruct, structName?: string): string[] {
  const name = structName || struct.name;
  const helpers: string[] = [];

  struct.fields.forEach((field) => {
    let template: string;

    switch (field.type) {
      case AbiType.Bool:
        template = MEMORY_GETTER_TEMPLATES.BOOL(name, field.name, field.offset);
        break;
      case AbiType.String: {
        template = MEMORY_GETTER_TEMPLATES.STRING(name, field.name, field.offset);
        break;
      }
      default:
        template = MEMORY_GETTER_TEMPLATES.GENERIC(name, field.name, field.offset);
        break;
    }

    helpers.push(template);
  });

  return helpers;
}

/**
 * Generates memory setter functions for struct fields
 * Creates functions that can set values on memory struct instances
 *
 * @param struct - The struct definition containing field information
 * @param structName - Name of the struct (derived from struct.name if not provided)
 */
export function generateMemorySetters(struct: IRStruct, structName?: string): string[] {
  const name = structName || struct.name;
  const helpers: string[] = [];

  struct.fields.forEach((field) => {
    let template: string;

    if (field.type === AbiType.String) {
      template = MEMORY_SETTER_TEMPLATES.STRING(name, field.name, field.offset);
    } else {
      template = MEMORY_SETTER_TEMPLATES.GENERIC(name, field.name, field.offset);
    }

    helpers.push(template);
  });

  return helpers;
}
