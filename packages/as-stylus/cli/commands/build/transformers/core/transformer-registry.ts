import { IRExpression } from "@/cli/types/ir.types.js";

import { TypeTransformer } from "./base-abstract-handlers.js";

/**
 * **Transformer Registry**
 * 
 * Central registry for managing type-specific transformers in the IR-to-AssemblyScript 
 * compilation pipeline. This class implements a priority-based transformer selection 
 * system where the order of registration determines evaluation precedence.
 * 
 * **Key Features:**
 * - **Priority System**: First registered transformer has highest priority
 * - **Type Safety**: Prevents conflicts between similar type operations
 * - **Dynamic Management**: Support for runtime registration/unregistration
 * - **Expression Routing**: Automatically routes expressions to appropriate transformers
 * 
 * **Registration Order (Priority):**
 * 1. **Chained Call Analyzer** - Complex method chains
 * 2. **Type-Specific Transformers** - U256, I256, Address, String, Boolean
 * 3. **Generic Transformers** - Mapping, Event, Error handling
 * 4. **Fallback Handlers** - Expression, Call transformers
 * 
 * **Transformer Conflict Resolution:**
 * - Each transformer's `canHandle()` method is checked in registration order
 * - First transformer that returns `true` processes the expression
 * - Type-specific exclusions prevent cross-type interference
 * 
 * @example
 * ```typescript
 * // Registration order determines priority
 * registry.register(new U256Transformer(context));      // High priority
 * registry.register(new CallTransformer(context));      // Lower priority
 * 
 * // U256 expressions go to U256Transformer, others to CallTransformer
 * const transformer = registry.detectExpressionType(expr);
 * ```
 */
export class TransformerRegistry {
  /** Array maintaining registration order for priority-based selection */
  private transformers: TypeTransformer[] = [];

  /**
   * Registers a new transformer with priority based on registration order.
   * 
   * **Important**: Earlier registration = higher priority. The first transformer
   * that can handle an expression will process it.
   * 
   * @param transformer - The type transformer to register
   * 
   * @example
   * ```typescript
   * // This order matters for expression routing
   * registry.register(new U256Transformer(context));     // Handles U256 first
   * registry.register(new CallTransformer(context));     // Handles remaining calls
   * ```
   */
  register(transformer: TypeTransformer): void {
    this.transformers.push(transformer);
  }

  /**
   * Removes a transformer from the registry by its type name.
   * 
   * @param typeName - The name of the transformer type to remove
   * 
   * @example
   * ```typescript
   * registry.unregister("U256"); // Removes U256Transformer
   * ```
   */
  unregister(typeName: string): void {
    this.transformers = this.transformers.filter(t => t.typeName !== typeName);
  }

  /**
   * Retrieves a specific transformer by its type name.
   * 
   * @param typeName - The name of the transformer type to find
   * @returns The transformer instance or undefined if not found
   */
  get(typeName: string): TypeTransformer | undefined {
    return this.transformers.find(t => t.typeName === typeName);
  }

  /**
   * Returns a copy of all registered transformers.
   * 
   * @returns Array of all registered transformers in registration order
   */
  getAll(): TypeTransformer[] {
    return [...this.transformers];
  }

  /**
   * Detects and returns the appropriate transformer for a given IR expression.
   * 
   * **Selection Algorithm:**
   * 1. Iterate through transformers in registration order (priority)
   * 2. Call each transformer's `canHandle(expr)` method
   * 3. Return the first transformer that returns `true`
   * 4. Return `null` if no transformer can handle the expression
   * 
   * @param expr - The IR expression to route to a transformer
   * @returns The selected transformer or null if none can handle the expression
   * 
   * @example
   * ```typescript
   * // Automatically routes based on expression type
   * const expr = { kind: "call", target: "U256Factory.fromString", ... };
   * const transformer = registry.detectExpressionType(expr); // Returns U256Transformer
   * ```
   */
  detectExpressionType(expr: IRExpression): TypeTransformer | null {
    for (const transformer of this.transformers) {
      if (transformer.canHandle(expr)) {
        return transformer;
      }
    }

    return null;
  }

  /**
   * Removes all registered transformers from the registry.
   * 
   * Useful for testing or complete reinitialization of the transformer pipeline.
   */
  clear(): void {
    this.transformers = [];
  }
}

