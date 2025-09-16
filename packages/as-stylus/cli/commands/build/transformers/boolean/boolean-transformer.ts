// src/cli/transformers/boolean/boolean-transformer.ts

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";
import { BooleanCopyHandler } from "./handlers/copy-handler.js";
import { BooleanLiteralHandler } from "./handlers/literal-handler.js";
import { BooleanVariableHandler } from "./handlers/variable-handler.js";
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
    this.registerHandler(new BooleanVariableHandler(contractContext));
  }

  /**
   * Detect if an expression is a boolean literal, variable, or boolean.copy
   */
  canHandle(expr: IRExpression): boolean {
    if (expr?.kind === "literal" && typeof expr.value === "boolean") {
      return true;
    }

    if (expr?.kind === "call" && expr.target === "boolean.copy") {
      return true;
    }

    if (
      expr?.kind === "var" &&
      (expr.type === AbiType.Bool ||
        expr.originalType === "bool" ||
        expr.originalType === "boolean")
    ) {
      return true;
    }

    return false;
  }
}
