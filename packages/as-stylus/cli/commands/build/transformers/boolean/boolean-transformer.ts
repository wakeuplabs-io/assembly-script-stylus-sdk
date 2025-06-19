// src/cli/transformers/boolean/boolean-transformer.ts

import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { BaseTypeTransformer, registerTransformer } from "../core/base-transformer.js";
import { BooleanLiteralHandler } from "./handlers/literal-handler.js";

/**
 * Boolean transformer using the handler pattern
 */
export class BooleanTransformer extends BaseTypeTransformer {
  constructor() {
    super("boolean");

    // Register literal handler
    this.registerHandler(new BooleanLiteralHandler());
  }

  /**
   * Detect if an expression is a boolean literal (true/false)
   */
  matchesType(expr: any): boolean {
    return expr?.kind === "literal" && typeof expr.value === "boolean";
  }

  /**
   * Fallback if no handler matched
   */
  protected handleDefault(
    expr: any,
    _context: EmitContext,
    _emitExprFn: (expr: any, ctx: EmitContext) => EmitResult
  ): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported boolean expression: ${JSON.stringify(expr)} */`,
      valueType: "boolean",
    };
  }

  /**
   * Generates code to load a boolean value from storage
   */
  generateLoadCode(property: string): string {
    return `load_bool(${property})`;
  }

  /**
   * Generates code to store a boolean value to storage
   */
  generateStoreCode(property: string, valueExpr: string): string {
    return `store_bool(${property}, ${valueExpr});`;
  }
}

// Export concrete instance and register it
export const BooleanTransformerInstance = new BooleanTransformer();
registerTransformer(BooleanTransformerInstance);
