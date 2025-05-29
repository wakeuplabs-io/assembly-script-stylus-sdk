import { ParameterDeclaration } from "ts-morph";
import { IRBuilder } from "../shared/ir-builder.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRArgument, IRExpression } from "@/cli/types/ir.types.js";

/**
 * Builds the IR for a function argument expression
 * Example: In function call f(x, y + 1, "hello"), handles each argument
 */
export class ArgumentIRBuilder extends IRBuilder<IRArgument> {
  private argument: ParameterDeclaration;

  constructor(argument: ParameterDeclaration, errorManager: ErrorManager) {
    super(errorManager);
    this.argument = argument;
  }

  validate(): boolean {
    // TODO: Implement argument validation
    return true;
  }

  buildIR(): IRArgument {
    return {
      name: this.argument.getName(),
      type: this.argument.getType().getText(),
    };
  }
}
