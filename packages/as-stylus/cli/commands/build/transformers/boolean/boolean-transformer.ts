// src/cli/transformers/boolean/boolean-transformer.ts

import { IRExpression } from "@/cli/types/ir.types.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";
import { BooleanCopyHandler } from "./handlers/copy-handler.js";
import { BooleanLiteralHandler } from "./handlers/literal-handler.js";
import { ContractContext } from "../core/contract-context.js";

/**
 * Boolean transformer using the handler pattern
 */
export class BooleanTransformer extends BaseTypeTransformer {
  constructor(contractContext: ContractContext) {
    super(contractContext, "boolean");

    // Register handlers  
    this.registerHandler(new BooleanCopyHandler(contractContext));
    this.registerHandler(new BooleanLiteralHandler(contractContext));
  }

  /**
   * Detect if an expression is a boolean literal (true/false) or boolean.copy
   */
  canHandle(expr: IRExpression): boolean {
    if (expr?.kind === "literal" && typeof expr.value === "boolean") {
      return true;
    }
    
    if (expr?.kind === "call" && expr.target === "boolean.copy") {
      return true;
    }
    
    return false;
  }
}
