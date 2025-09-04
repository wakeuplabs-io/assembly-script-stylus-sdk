import { AbiType } from "@/cli/types/abi.types.js";
import { IRStruct } from "@/cli/types/ir.types.js";

const ALLOCS_TEMPLATES = {
  static: (name: string, size: number) => `
export function ${name}_memory_alloc(): usize {
  const ptr = Struct.alloc(${size});
  return ptr;
}`,
  dynamic: (name: string, dynamicSize: number) => `
export function ${name}_memory_alloc(): usize {
  const ptr = Struct.alloc(${dynamicSize});
  store<u8>(ptr + 31, 0x20);
  return ptr;
}`
};

const MEMORY_GETTER_TEMPLATES = {
  BOOL: (name: string, fieldName: string, offset: number) => `
export function ${name}_memory_get_${fieldName}(ptr: usize): boolean {
  return Boolean.fromABI(ptr + ${offset});
}`,

  STRING: (name: string, fieldName: string, fieldOffset: number) => `
export function ${name}_memory_get_${fieldName}(ptr: usize): usize {
  return Struct.getMemoryString(ptr + 32, ptr + ${fieldOffset});
}`,

  GENERIC: (name: string, fieldName: string, offset: number) => `
export function ${name}_memory_get_${fieldName}(ptr: usize): usize {
  const pointer = malloc(32);
  for (let i = 0; i < 32; i++) {
    store<u8>(pointer + i, load<u8>(ptr + ${offset} + i));
  }
  return pointer;
}`
};

const MEMORY_SETTER_TEMPLATES = {
  STRING: (name: string, fieldName: string, fieldOffset: number, dynamicOffset: number) => `
export function ${name}_memory_set_${fieldName}(ptr: usize, v: usize): void {
  Struct.setMemoryString(ptr + ${fieldOffset}, v, ${dynamicOffset});
}`,

  GENERIC: (name: string, fieldName: string, fieldOffset: number) => `
export function ${name}_memory_set_${fieldName}(ptr: usize, v: usize): void {
  for (let i = 0; i < 32; i++) {
    store<u8>(ptr + ${fieldOffset} + i, load<u8>(v + i));
  }
}`
};

/**
 * Generates memory allocation function for struct
 * Creates a function that allocates memory for a struct instance
 * 
 * @param struct - The struct definition containing field information
 * @param structName - Name of the struct (derived from struct.name if not provided)
 */
export function generateMemoryAlloc(
  struct: IRStruct,
  structName?: string
): string {
  const name = structName || struct.name;

  const strings = struct.fields.filter((field) => field.type === AbiType.String);
  const isDynamic = strings.length > 0;
  if (isDynamic) {
    const dynamicSize = struct.size + strings.length * 64 + 32;
    return ALLOCS_TEMPLATES.dynamic(name, dynamicSize);
  }

  return ALLOCS_TEMPLATES.static(name, struct.size);
}

/**
 * Generates memory getter functions for struct fields
 * Creates functions that can retrieve values from memory struct instances
 * 
 * @param struct - The struct definition containing field information
 * @param structName - Name of the struct (derived from struct.name if not provided)
 */
export function generateMemoryGetters(
  struct: IRStruct,
  structName?: string
): string[] {
  const name = structName || struct.name;
  const helpers: string[] = [];

  struct.fields.forEach((field) => {
    let template: string;

    switch (field.type) {
      case AbiType.Bool:
        template = MEMORY_GETTER_TEMPLATES.BOOL(name, field.name, field.memoryOffset);
        break;
      case AbiType.String: {
        template = MEMORY_GETTER_TEMPLATES.STRING(name, field.name, field.memoryOffset);
        break;
      }
      default:
        template = MEMORY_GETTER_TEMPLATES.GENERIC(name, field.name, field.memoryOffset);
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
export function generateMemorySetters(
  struct: IRStruct,
  structName?: string
): string[] {
  const name = structName || struct.name;
  const helpers: string[] = [];

  struct.fields.forEach((field) => {
    let template: string;

    if (field.type === AbiType.String) {
      const previousStrings = struct.fields.filter(f => f.type === AbiType.String && f.offset < field.offset);
      const dynamicOffset = struct.size + previousStrings.length * 64;
      template = MEMORY_SETTER_TEMPLATES.STRING(name, field.name, field.memoryOffset, dynamicOffset);
    } else {
      template = MEMORY_SETTER_TEMPLATES.GENERIC(name, field.name, field.memoryOffset);
    }

    helpers.push(template);
  });

  return helpers;
}

