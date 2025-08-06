import { IRExpression } from "@/cli/types/ir.types.js";

import { TypeTransformer } from "./base-abstract-handlers.js";

/**
 * Registry for managing type transformers
 * Encapsulates the global state management
 */
export class TransformerRegistry {
  private transformers: Map<string, TypeTransformer> = new Map();

  /**
   * Registers a transformer
   */
  register(transformer: TypeTransformer): void {
    this.transformers.set(transformer.typeName, transformer);
  }

  /**
   * Unregister a transformer by type name
   */
  unregister(typeName: string): void {
    this.transformers.delete(typeName);
  }

  /**
   * Get a transformer by type name
   */
  get(typeName: string): TypeTransformer | undefined {
    return this.transformers.get(typeName);
  }

  /**
   * Get all registered transformers
   */
  getAll(): TypeTransformer[] {
    return Array.from(this.transformers.values());
  }

  /**
   * Detects the most probable type of an expression
   */
  detectExpressionType(expr: IRExpression): TypeTransformer | null {
    // First, try registered transformers
    for (const transformer of this.transformers.values()) {
      if (transformer.canHandle(expr)) {
        return transformer;
      }
    }

    return null;
  }

  /**
   * Clears all registered transformers
   */
  clear(): void {
    this.transformers.clear();
  }
}

