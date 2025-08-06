import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { TypeTransformer } from "./base-abstract-handlers.js";
import { TransformerRegistry } from "./transformer-registry.js";


/**
 * Context manager for expression transformations.
 * Handles creation and management of emit contexts independently from the expression handler.
 */
export class ContractContext {
  private contractName: string;
  private parentName: string;
  private transformerRegistry: TransformerRegistry;

  constructor(transformerRegistry: TransformerRegistry, contractName: string = "", parentName: string = "") {
    this.contractName = contractName;
    this.parentName = parentName;
    this.transformerRegistry = transformerRegistry;
  }

  getContractName(): string {
    return this.contractName;
  }

  getParentName(): string {
    return this.parentName;
  }

  emit(expr: IRExpression): EmitResult {
    const transformer = this.transformerRegistry.detectExpressionType(expr);
    if (transformer) {
      return transformer.handle(expr);
    }

    return {
      setupLines: [],
      valueExpr: expr.toString()
    };
  }
}


/**
 * Detects the most probable type of an expression by consulting all registered transformers.
 * If no transformer matches, applies a fallback logic for certain "call" expressions:
 *   - If the expression is a factory call (e.g., "U256Factory.create"), it infers the type from the factory name.
 *   - If any transformer can handle the method call (via canHandleMethodCall), it returns that type.
 * If neither the transformers nor the fallback logic match, returns null (default case).
 *
 * @param expr - The IR expression to analyze.
 * @returns The type name if detected, or null if no transformer or fallback matches.
 */
export function detectExpressionType(expr: IRExpression, typeTransformers: Record<string, TypeTransformer>): string | null {
  for (const typeName in typeTransformers) {
    if (typeTransformers[typeName].canHandle(expr)) {
      return typeName;
    }
  }

  return null;
}