import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, IRStatement, IRVariable, IRContract } from "@/cli/types/ir.types.js";

import { TypeTransformer } from "./base-abstract-handlers.js";
import { TransformerRegistry } from "./transformer-registry.js";
import { StatementHandler } from "../statements/statement-handler.js";


/**
 * Context manager for expression transformations.
 * Handles creation and management of emit contexts independently from the expression handler.
 */
export class ContractContext {
  private contractName: string;
  private parentName: string;
  private transformerRegistry: TransformerRegistry;
  private contractIR: IRContract | null;

  constructor(
    transformerRegistry: TransformerRegistry, 
    contractIR: IRContract | null = null
  ) {
    this.transformerRegistry = transformerRegistry;
    this.contractIR = contractIR;
    this.contractName = contractIR?.name ?? "";
    this.parentName = contractIR?.parent?.name ?? "";
  }

  getContractName(): string {
    return this.contractName;
  }

  getParentName(): string {
    return this.parentName;
  }

  getContractIR(): IRContract | null {
    return this.contractIR;
  }

  emitExpression(expr: IRExpression): EmitResult {
    const transformer = this.transformerRegistry.detectExpressionType(expr);
    if (transformer) {
      return transformer.handle(expr);
    }

    return {
      setupLines: [],
      valueExpr: expr.toString()
    };
  }

  emitStatements(statements: IRStatement[]): string { 
    const statementHandler = new StatementHandler(this);
    return statementHandler.handleStatements(statements);
  }

  /**
   * Gets a storage variable from the contract IR by name
   * @param name - The name of the storage variable
   * @returns The storage variable if found, undefined otherwise
   */
  getStorageVariable(name: string): IRVariable | undefined {
    if (!this.contractIR) {
      return undefined;
    }
    return this.contractIR.storage.find(v => v.name === name);
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