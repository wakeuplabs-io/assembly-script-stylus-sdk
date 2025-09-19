import { AbiType } from "@/cli/types/abi.types.js";

export const TYPE_SIZES: Record<string, number> = {
  [AbiType.Bool]: 32,
  [AbiType.Uint256]: 32,
  [AbiType.Address]: 32,
  [AbiType.String]: 32, // Dynamic string pointer
};

// Dynamic types (require indirect storage)
export const DYNAMIC_TYPES = new Set([AbiType.String, AbiType.Array]);

/**
 * Determines if a type is dynamic
 */
export function isDynamicType(type: AbiType): boolean {
  return DYNAMIC_TYPES.has(type) || type.startsWith("Array<") || type.includes("[]");
}

/**
 * Gets the size of a type in bytes
 */
export function getTypeSize(type: AbiType): number {
  if (isDynamicType(type)) {
    return 32;
  }

  return TYPE_SIZES[type] || 32;
}

/**
 * Calculates the field layout in a struct
 */
export function calculateFieldLayout(fields: Array<{ name: string; type: AbiType }>) {
  const countString = fields.filter((field) => field.type === AbiType.String).length;
  let currentOffset = 0;
  const isDynamic = countString > 0;

  const layoutFields = fields.map((field) => {
    const fieldSize = getTypeSize(field.type);
    const fieldDynamic = isDynamicType(field.type);

    const layoutField = {
      name: field.name,
      type: field.type,
      offset: currentOffset,
      size: fieldSize,
      dynamic: fieldDynamic,
    };

    currentOffset += fieldSize;
    return layoutField;
  });

  return {
    fields: layoutFields,
    totalSize: currentOffset,
    dynamic: isDynamic,
    alignment: 32, // EVM alignment (32 bytes)
  };
}
