import { CallExpression, Expression } from "ts-morph";
import { IRBuilder } from "../shared/ir-builder.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRExpression } from "@/cli/types/ir.types.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";

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
    const args = this.call.getArguments().map((argument) => {
      const expressionBuilder = new ExpressionIRBuilder(argument as Expression, this.errorManager);
      return expressionBuilder.validateAndBuildIR();
    });
    return { kind: "call", target, args };
  }
}