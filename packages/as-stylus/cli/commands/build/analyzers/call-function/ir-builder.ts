import { CallExpression } from "ts-morph";
import { IRBuilder } from "../shared/ir-builder.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRExpression } from "@/cli/types/ir.types.js";

export class CallFunctionIRBuilder extends IRBuilder<IRExpression> {
  private call: CallExpression;

  constructor(expression: CallExpression, errorManager: ErrorManager) {
    super(errorManager);
    this.call = expression;
  }

  validate(): boolean {
    return true;
  }

  buildIR(): IRExpression {
    const target = this.call.getExpression().getText();
    // const args = this.call.getArguments().map((a) => toIRExpr(a as Expression));
    // TODO: Implement args builder
    return { kind: "call", target, args: [] };
  }
}