import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { ContractContext } from "./contract-context.js";

//TODO: move interfaces to a separate file
/**
 * Interface for expression handlers that can process specific expression patterns
 * Each handler implements a strategy for handling a specific type of expression
 */
export abstract class Handler {
  constructor(protected contractContext: ContractContext) {
  }

  /**
   * Determines if this handler can process the given expression
   */
  abstract canHandle(expr: IRExpression): boolean;

  /**
   * Processes the expression and returns the EmitResult
   */
  abstract handle(expr: IRExpression, isStatement?: boolean): EmitResult;
}

export abstract class TypeTransformer extends Handler {
  readonly typeName: string;

  constructor(contractContext: ContractContext, typeName: string) {
    super(contractContext);
    this.typeName = typeName;
  }

  protected handleDefault(expr: IRExpression): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported expression: ${JSON.stringify(expr)} */`,
      valueType: expr.type,
    };
  }
}
