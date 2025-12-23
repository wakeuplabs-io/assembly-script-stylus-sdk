import { extractStructName } from "@/cli/commands/build/analyzers/struct/struct-utils.js";
import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/cli/commands/build/transformers/core/contract-context.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, IRMapGet, IRMapSet, IRMapGet2, IRMapSet2 } from "@/cli/types/ir.types.js";

/**
 * Mapping methods for different value types
 */
const MAPPING_METHODS = {
  U256: {
    get: "getU256",
    set: "setU256",
  },
  Address: {
    get: "getAddress",
    set: "setAddress",
  },
  Boolean: {
    get: "getBoolean",
    set: "setBoolean",
  },
  String: {
    get: "getString",
    set: "setString",
  },
  Struct: {
    get: "getStruct",
    set: "setStruct",
  },
} as const;

/**
 * Nested mapping methods
 */
export const NESTED_MAPPING_METHODS = {
  U256: {
    get: "getU256",
    set: "setU256",
  },
  boolean: {
    get: "getBoolean",
    set: "setBoolean",
  },
} as const;

/**
 * Transformer for mapping operations.
 * Handles both simple mappings and nested mappings (mapping2).
 */
export class MappingTransformer extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    return (
      expr.kind === "map_get" ||
      expr.kind === "map_set" ||
      expr.kind === "map_get2" ||
      expr.kind === "map_set2"
    );
  }

  handle(expr: IRExpression): EmitResult {
    switch (expr.kind) {
      case "map_get":
        return this.transformMapGet(expr as IRMapGet);
      case "map_set":
        return this.transformMapSet(expr as IRMapSet);
      case "map_get2":
        return this.transformMapGet2(expr as IRMapGet2);
      case "map_set2":
        return this.transformMapSet2(expr as IRMapSet2);
      default:
        return {
          setupLines: [],
          valueExpr: `/* Unsupported mapping operation: ${expr.kind} */`,
        };
    }
  }

  private transformMapGet(expr: IRMapGet): EmitResult {
    const keyResult = this.contractContext.emitExpression(expr.key);
    const method = this.getMappingMethod(expr.valueType, "get");
    const slot = this.formatSlot(expr.slot);
    const normalizedKeyType = expr.keyType.toLowerCase();
    const normalizedValueType = this.normalizeValueType(expr.valueType);

    // Handle Struct values
    if (normalizedValueType === "Struct") {
      const structInfo = this.getStructInfo(expr.valueType);
      if (!structInfo) {
        throw new Error(`Could not find struct information for type: ${expr.valueType}`);
      }

      if (normalizedKeyType === "boolean" || normalizedKeyType === "bool") {
        return {
          setupLines: keyResult.setupLines,
          valueExpr: `Mapping.getStruct(${slot}, Boolean.create(${keyResult.valueExpr}), 32, ${structInfo.size})`,
        };
      }

      const { keyPtr, keyLen } = this.getKeyPtrAndLen(expr.keyType, keyResult.valueExpr);

      // Handle string keys with struct values
      if (normalizedKeyType === "string") {
        return {
          setupLines: keyResult.setupLines,
          valueExpr: `Mapping.getStructWithStringKey(${slot}, ${keyPtr}, ${keyLen}, ${structInfo.size})`,
        };
      }

      return {
        setupLines: keyResult.setupLines,
        valueExpr: `Mapping.getStruct(${slot}, ${keyResult.valueExpr}, 32, ${structInfo.size})`,
      };
    }

    if (normalizedKeyType === "boolean" || normalizedKeyType === "bool") {
      return {
        setupLines: keyResult.setupLines,
        valueExpr: `Mapping.${method}(${slot}, Boolean.create(${keyResult.valueExpr}))`,
      };
    }

    const { keyPtr, keyLen } = this.getKeyPtrAndLen(expr.keyType, keyResult.valueExpr);

    // Handle string keys
    if (normalizedKeyType === "string") {
      if (method === "getString") {
        return {
          setupLines: keyResult.setupLines,
          valueExpr: `Mapping.getStringWithKeyLen(${slot}, ${keyPtr}, ${keyLen})`,
        };
      }
      // For other value types with string keys, use the WithStringKey methods
      const stringKeyMethod = this.getMappingMethodWithStringKey(expr.valueType, "get");
      return {
        setupLines: keyResult.setupLines,
        valueExpr: `Mapping.${stringKeyMethod}(${slot}, ${keyPtr}, ${keyLen})`,
      };
    }

    return {
      setupLines: keyResult.setupLines,
      valueExpr: `Mapping.${method}(${slot}, ${keyResult.valueExpr})`,
    };
  }

  private transformMapSet(expr: IRMapSet): EmitResult {
    const keyResult = this.contractContext.emitExpression(expr.key);
    const valueResult = this.contractContext.emitExpression(expr.value);
    const method = this.getMappingMethod(expr.valueType, "set");
    const slot = this.formatSlot(expr.slot);
    const normalizedKeyType = expr.keyType.toLowerCase();
    const normalizedValueType = this.normalizeValueType(expr.valueType);

    // Handle Struct values
    if (normalizedValueType === "Struct") {
      const structInfo = this.getStructInfo(expr.valueType);
      if (!structInfo) {
        throw new Error(`Could not find struct information for type: ${expr.valueType}`);
      }

      if (normalizedKeyType === "boolean" || normalizedKeyType === "bool") {
        return {
          setupLines: [...keyResult.setupLines, ...valueResult.setupLines],
          valueExpr: `Mapping.setStruct(${slot}, Boolean.create(${keyResult.valueExpr}), 32, ${valueResult.valueExpr}, ${structInfo.size})`,
        };
      }

      const { keyPtr, keyLen } = this.getKeyPtrAndLen(expr.keyType, keyResult.valueExpr);

      // Handle string keys with struct values
      if (normalizedKeyType === "string") {
        return {
          setupLines: [...keyResult.setupLines, ...valueResult.setupLines],
          valueExpr: `Mapping.setStructWithStringKey(${slot}, ${keyPtr}, ${keyLen}, ${valueResult.valueExpr}, ${structInfo.size})`,
        };
      }

      return {
        setupLines: [...keyResult.setupLines, ...valueResult.setupLines],
        valueExpr: `Mapping.setStruct(${slot}, ${keyResult.valueExpr}, 32, ${valueResult.valueExpr}, ${structInfo.size})`,
      };
    }

    if (normalizedKeyType === "boolean" || normalizedKeyType === "bool") {
      return {
        setupLines: [...keyResult.setupLines, ...valueResult.setupLines],
        valueExpr: `Mapping.${method}(${slot}, Boolean.create(${keyResult.valueExpr}), ${valueResult.valueExpr})`,
      };
    }

    const { keyPtr, keyLen } = this.getKeyPtrAndLen(expr.keyType, keyResult.valueExpr);

    // Handle string keys
    if (normalizedKeyType === "string") {
      if (method === "setString") {
        return {
          setupLines: [...keyResult.setupLines, ...valueResult.setupLines],
          valueExpr: `Mapping.setStringWithKeyLen(${slot}, ${keyPtr}, ${keyLen}, ${valueResult.valueExpr})`,
        };
      }
      // For other value types with string keys, use the WithStringKey methods
      const stringKeyMethod = this.getMappingMethodWithStringKey(expr.valueType, "set");
      return {
        setupLines: [...keyResult.setupLines, ...valueResult.setupLines],
        valueExpr: `Mapping.${stringKeyMethod}(${slot}, ${keyPtr}, ${keyLen}, ${valueResult.valueExpr})`,
      };
    }

    return {
      setupLines: [...keyResult.setupLines, ...valueResult.setupLines],
      valueExpr: `Mapping.${method}(${slot}, ${keyResult.valueExpr}, ${valueResult.valueExpr})`,
    };
  }

  private transformMapGet2(expr: IRMapGet2): EmitResult {
    const key1Result = this.contractContext.emitExpression(expr.key1);
    const key2Result = this.contractContext.emitExpression(expr.key2);
    const method = this.getNestedMappingMethod(expr.valueType, "get");
    const slot = this.formatSlot(expr.slot);

    const baseExpr = `MappingNested.${method}(${slot}, ${key1Result.valueExpr}, ${key2Result.valueExpr})`;

    const valueExpr = baseExpr;

    return {
      setupLines: [...key1Result.setupLines, ...key2Result.setupLines],
      valueExpr,
    };
  }

  private transformMapSet2(expr: IRMapSet2): EmitResult {
    const key1Result = this.contractContext.emitExpression(expr.key1);
    const key2Result = this.contractContext.emitExpression(expr.key2);
    const valueResult = this.contractContext.emitExpression(expr.value);
    const method = this.getNestedMappingMethod(expr.valueType, "set");
    const slot = this.formatSlot(expr.slot);

    return {
      setupLines: [...key1Result.setupLines, ...key2Result.setupLines, ...valueResult.setupLines],
      valueExpr: `MappingNested.${method}(${slot}, ${key1Result.valueExpr}, ${key2Result.valueExpr}, ${valueResult.valueExpr})`,
    };
  }

  private getMappingMethod(valueType: string, operation: "get" | "set"): string {
    const normalizedType = this.normalizeValueType(valueType);
    const methods = MAPPING_METHODS[normalizedType as keyof typeof MAPPING_METHODS];

    if (!methods) {
      return operation === "get" ? "getU256" : "setU256"; // fallback
    }

    return methods[operation];
  }

  private getMappingMethodWithStringKey(valueType: string, operation: "get" | "set"): string {
    const normalizedType = this.normalizeValueType(valueType);

    switch (normalizedType) {
      case "U256":
        return operation === "get" ? "getU256WithStringKey" : "setU256WithStringKey";
      case "Address":
        return operation === "get" ? "getAddressWithStringKey" : "setAddressWithStringKey";
      case "Boolean":
        return operation === "get" ? "getBooleanWithStringKey" : "setBooleanWithStringKey";
      case "I256":
        return operation === "get" ? "getI256WithStringKey" : "setI256WithStringKey";
      case "Struct":
        return operation === "get" ? "getStructWithStringKey" : "setStructWithStringKey";
      default:
        // Fallback to U256 methods
        return operation === "get" ? "getU256WithStringKey" : "setU256WithStringKey";
    }
  }

  private getNestedMappingMethod(valueType: string, operation: "get" | "set"): string {
    const methods = NESTED_MAPPING_METHODS[valueType as keyof typeof NESTED_MAPPING_METHODS];

    if (!methods) {
      return operation === "get" ? "getU256" : "setU256"; // fallback
    }

    return methods[operation];
  }

  private normalizeValueType(valueType: string): string {
    // Check if it's a Struct<...> type
    if (valueType.startsWith("Struct<") || valueType.toLowerCase().startsWith("struct<")) {
      return "Struct";
    }

    // Check if the type is a struct template by consulting contractIR
    const contractIR = this.contractContext.getContractIR();
    if (contractIR && contractIR.structs) {
      const structName = extractStructName(valueType);
      const isStruct = contractIR.structs.some((s) => s.name === structName);
      if (isStruct) {
        return "Struct";
      }
    }

    switch (valueType.toLowerCase()) {
      case "uint256":
      case "u256":
        return "U256";
      case "int256":
      case "i256":
        return "I256";
      case "address":
        return "Address";
      case "bool":
      case "boolean":
        return "Boolean";
      case "string":
        return "String";
      default:
        throw new Error(`Unsupported value type: ${valueType}`);
    }
  }

  /**
   * Gets struct information (name and size) from the valueType string
   * @param valueType - The value type string (e.g., "Struct<UserInfo>")
   * @returns Struct information with name and size, or null if not found
   */
  private getStructInfo(valueType: string): { name: string; size: number } | null {
    // Extract struct name from "Struct<UserInfo>" format
    let structName: string | null = null;
    if (valueType.startsWith("Struct<") && valueType.endsWith(">")) {
      const innerType = valueType.slice(7, -1); // Extract "UserInfo" from "Struct<UserInfo>"
      structName = extractStructName(innerType);
    } else {
      structName = extractStructName(valueType);
    }

    if (!structName) {
      return null;
    }

    const contractIR = this.contractContext.getContractIR();
    if (!contractIR || !contractIR.structs) {
      return null;
    }

    const struct = contractIR.structs.find((s) => s.name === structName);
    if (!struct) {
      return null;
    }

    return {
      name: struct.name,
      size: struct.size,
    };
  }

  private formatSlot(slot: number): string {
    return `__SLOT${slot.toString(16).padStart(2, "0")}`;
  }

  private getKeyPtrAndLen(keyType: string, keyExpr: string): { keyPtr: string; keyLen: string } {
    switch (keyType.toLowerCase()) {
      case "uint256":
      case "u256":
      case "int256":
      case "i256":
      case "address":
        return { keyPtr: keyExpr, keyLen: "32" }; // These types are always 32 bytes
      case "string":
        // For strings, the pointer points to the header (length), but createMappingKey needs data pointer
        return {
          keyPtr: `${keyExpr} + 4`, // Skip the 4-byte length header
          keyLen: `load<u32>(${keyExpr})`, // String length is stored at the pointer (first 4 bytes)
        };
      case "bool":
      case "boolean":
        return { keyPtr: keyExpr, keyLen: "32" }; // Boolean is converted to 32-byte representation
      default:
        return { keyPtr: keyExpr, keyLen: "32" }; // Default to 32 bytes for unknown types
    }
  }
}
