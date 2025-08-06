import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { Handler, TypeTransformer } from "./base-abstract-handlers.js";
import { ContractContext } from "./contract-context.js";

/** 
 * Base class for type transformers that implements shared functionality
 * Uses the Chain of Responsibility pattern to delegate to specific expression handlers
 */
export abstract class BaseTypeTransformer extends TypeTransformer {
  private handlers: Handler[] = [];

  constructor(contractContext: ContractContext, typeName: string) {
    super(contractContext, typeName);
  }

  /**
   * Registers a handler that can process expressions of this type
   */
  protected registerHandler(handler: Handler): void {
    this.handlers.push(handler);
  }

  /**
   * Emits code for the given expression by finding an appropriate handler
   */
  handle(expr: IRExpression): EmitResult {
    // Try to find a matching handler
    for (const handler of this.handlers) {
      if (handler.canHandle(expr)) {
        return handler.handle(expr);
      }
    }
    
    // Fall back to default handling
    return this.handleDefault(expr);
  }

  /**
   * Handles expressions that don't match any registered handler
   */
  protected handleDefault(expr: IRExpression): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported expression: ${JSON.stringify(expr)} */`,
      valueType: expr.type,
    };
  }
}

/*
function detectExpressionTypeFallback(expr: any): string | null {
  if (expr.kind === "call") {
    if (expr.target.endsWith("Factory.create") || expr.target.endsWith("Factory.fromString")) {
      const typeName = expr.target.split("Factory.")[0];
      return typeName;
    }

    if (expr.target.startsWith("U256.")) return "U256";
    if (expr.target.startsWith("I256.")) return "I256";
    if (expr.target.startsWith("Address.")) return "Address";
    if (expr.target.startsWith("String.")) return "String";
  }

  return null;
}
*/