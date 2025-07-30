// src/cli/transformers/boolean/boolean-transformer.ts

import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";

import { BaseTypeTransformer, registerTransformer } from "../core/base-transformer.js";
import { BooleanCopyHandler } from "./handlers/copy-handler.js";
import { BooleanLiteralHandler } from "./handlers/literal-handler.js";

/**
 * Boolean transformer using the handler pattern
 */
export class BooleanTransformer extends BaseTypeTransformer {
  constructor() {
    super("boolean");

    // Register handlers  
    this.registerHandler(new BooleanCopyHandler());
    this.registerHandler(new BooleanLiteralHandler());
  }

  /**
   * Detect if an expression is a boolean literal (true/false) or boolean.copy
   */
  matchesType(expr: any): boolean {
    if (expr?.kind === "literal" && typeof expr.value === "boolean") {
      return true;
    }
    
    if (expr?.kind === "call" && expr.target === "boolean.copy") {
      return true;
    }
    
    return false;
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
}

// Export concrete instance and register it
export const BooleanTransformerInstance = new BooleanTransformer();
registerTransformer(BooleanTransformerInstance);
