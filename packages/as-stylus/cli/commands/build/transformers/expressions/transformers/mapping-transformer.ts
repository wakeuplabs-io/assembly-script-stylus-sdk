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

    // For boolean mappings, use Boolean.fromABI() in statement context
    let valueExpr = baseExpr;
    if (expr.valueType === "boolean") {
      valueExpr = `Boolean.fromABI(${baseExpr})`;
    }

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

  private getNestedMappingMethod(valueType: string, operation: "get" | "set"): string {
    const methods = NESTED_MAPPING_METHODS[valueType as keyof typeof NESTED_MAPPING_METHODS];

    if (!methods) {
      return operation === "get" ? "getU256" : "setU256"; // fallback
    }

    return methods[operation];
  }

  private normalizeValueType(valueType: string): string {
    switch (valueType.toLowerCase()) {
      case "uint256":
      case "u256":
        return "U256";
      case "address":
        return "Address";
      case "bool":
      case "boolean":
        return "Boolean";
      case "string":
        return "String";
      default:
        return "U256"; // fallback
    }
  }

  private formatSlot(slot: number): string {
    return `__SLOT${slot.toString(16).padStart(2, "0")}`;
  }
}
