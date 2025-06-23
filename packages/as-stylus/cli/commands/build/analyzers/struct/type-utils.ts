// Tamaños de tipos básicos en bytes (alineados a 32 bytes para EVM)
export const TYPE_SIZES: Record<string, number> = {
  "boolean": 32,
  "U256": 32,
  "Address": 32,
  "Str": 32, // Dynamic string pointer
  "string": 32, // Dynamic string pointer
};

// Dynamic types (require indirect storage)
export const DYNAMIC_TYPES = new Set([
  "Str",
  "string",
  "Array", // Dynamic arrays
]);

/**
 * Determines if a type is dynamic
 */
export function isDynamicType(type: string): boolean {
  return DYNAMIC_TYPES.has(type) || type.startsWith("Array<") || type.includes("[]");
}

/**
 * Gets the size of a type in bytes
 */
export function getTypeSize(type: string): number {
  // For dynamic types, return the size of the pointer
  if (isDynamicType(type)) {
    return 32; // 32 bytes pointer
  }
  
  return TYPE_SIZES[type] || 32; // Default 32 bytes for unknown types
}

/**
 * Calculates the field layout in a struct
 */
export function calculateFieldLayout(fields: Array<{ name: string; type: string }>) {
  let currentOffset = 0;
  let isDynamic = false;
  
  const layoutFields = fields.map(field => {
    const fieldSize = getTypeSize(field.type);
    const fieldDynamic = isDynamicType(field.type);
    
    if (fieldDynamic) {
      isDynamic = true;
    }
    
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