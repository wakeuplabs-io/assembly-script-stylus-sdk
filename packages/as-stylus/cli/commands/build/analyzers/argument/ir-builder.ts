import { ParameterDeclaration } from "ts-morph";

import { IRArgument } from "@/cli/types/ir.types.js";
import { VariableSymbol } from "@/cli/types/symbol-table.types.js";

import { IRBuilder } from "../shared/ir-builder.js";
import { convertTypeForIR } from "../struct/struct-utils.js";

/**
 * Builds the IR for a function argument expression
 * Example: In function call f(x, y + 1, "hello"), handles each argument
 */
export class ArgumentIRBuilder extends IRBuilder<IRArgument> {
  private argument: ParameterDeclaration;

  constructor(argument: ParameterDeclaration) {
    super(argument);
    this.argument = argument;
  }

  validate(): boolean {
    // TODO: Implement argument validation
    return true;
  }



  buildIR(): IRArgument {
    const typeString = this.argument.getType().getText();
    const convertedType = convertTypeForIR(typeString);
    
    const variable: VariableSymbol = {
      name: this.argument.getName(),
      type: convertedType.type,
      scope: "memory",
    };
    this.symbolTable.declareVariable(variable.name, variable);

    return {
      name: variable.name,
      type: variable.type,
      ...(convertedType.originalType && { originalType: convertedType.originalType })
    };
  }
}
