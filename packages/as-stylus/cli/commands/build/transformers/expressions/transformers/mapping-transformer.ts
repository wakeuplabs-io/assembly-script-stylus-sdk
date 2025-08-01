import { EmitResult, EmitContext } from "../../../../../types/emit.types.js";
import { IRExpression, IRMapGet, IRMapSet, IRMapGet2, IRMapSet2 } from "../../../../../types/ir.types.js";
import { MAPPING_METHODS, NESTED_MAPPING_METHODS } from "../constants/expression-constants.js";
import { IExpressionTransformer } from "../interfaces/expression-transformer.interface.js";

/**
 * Transformer for mapping operations.
 * Handles both simple mappings and nested mappings (mapping2).
 */
export class MappingTransformer implements IExpressionTransformer {
  canHandle(expr: IRExpression): boolean {
    return expr.kind === "map_get" || 
           expr.kind === "map_set" || 
           expr.kind === "map_get2" || 
           expr.kind === "map_set2";
  }

  transform(
    expr: IRExpression,
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    switch (expr.kind) {
      case "map_get":
        return this.transformMapGet(expr as IRMapGet, context, emitExpression);
      case "map_set":
        return this.transformMapSet(expr as IRMapSet, context, emitExpression);
      case "map_get2":
        return this.transformMapGet2(expr as IRMapGet2, context, emitExpression);
      case "map_set2":
        return this.transformMapSet2(expr as IRMapSet2, context, emitExpression);
      default:
        return {
          setupLines: [],
          valueExpr: `/* Unsupported mapping operation: ${expr.kind} */`
        };
    }
  }

  private transformMapGet(
    expr: IRMapGet,
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const keyResult = emitExpression(expr.key, context);
    const method = this.getMappingMethod(expr.valueType, "get");
    const slot = this.formatSlot(expr.slot);
    
    return {
      setupLines: keyResult.setupLines,
      valueExpr: `Mapping.${method}(${slot}, ${keyResult.valueExpr})`
    };
  }

  private transformMapSet(
    expr: IRMapSet,
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const keyResult = emitExpression(expr.key, context);
    const valueResult = emitExpression(expr.value, context);
    const method = this.getMappingMethod(expr.valueType, "set");
    const slot = this.formatSlot(expr.slot);
    
    return {
      setupLines: [...keyResult.setupLines, ...valueResult.setupLines],
      valueExpr: `Mapping.${method}(${slot}, ${keyResult.valueExpr}, ${valueResult.valueExpr})`
    };
  }

  private transformMapGet2(
    expr: IRMapGet2,
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const key1Result = emitExpression(expr.key1, context);
    const key2Result = emitExpression(expr.key2, context);
    const method = this.getNestedMappingMethod(expr.valueType, "get");
    const slot = this.formatSlot(expr.slot);
    
    const baseExpr = `MappingNested.${method}(${slot}, ${key1Result.valueExpr}, ${key2Result.valueExpr})`;
    
    // For boolean mappings, use Boolean.fromABI() in statement context
    let valueExpr = baseExpr;
    if (expr.valueType === "boolean" && context.isInStatement) {
      valueExpr = `Boolean.fromABI(${baseExpr})`;
    }
    
    return {
      setupLines: [...key1Result.setupLines, ...key2Result.setupLines],
      valueExpr
    };
  }

  private transformMapSet2(
    expr: IRMapSet2,
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const key1Result = emitExpression(expr.key1, context);
    const key2Result = emitExpression(expr.key2, context);
    const valueResult = emitExpression(expr.value, context);
    const method = this.getNestedMappingMethod(expr.valueType, "set");
    const slot = this.formatSlot(expr.slot);
    
    return {
      setupLines: [...key1Result.setupLines, ...key2Result.setupLines, ...valueResult.setupLines],
      valueExpr: `MappingNested.${method}(${slot}, ${key1Result.valueExpr}, ${key2Result.valueExpr}, ${valueResult.valueExpr})`
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