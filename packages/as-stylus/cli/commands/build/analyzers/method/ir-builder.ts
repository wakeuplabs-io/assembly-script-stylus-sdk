import { Block } from "ts-morph";

import { MethodDeclaration } from "ts-morph";
import { ErrorManager } from "../shared/error-manager";
import { IRBuilder } from "../shared/ir-builder";

import { IRMethod } from "@/cli/types/ir.types";
import { STATE_MUTABILITY_DECORATORS, VISIBILITY_DECORATORS } from "@/cli/types/abi.types";
import { StatementIRBuilder } from "../statement/ir-builder";
import { MethodSyntaxValidator } from "./syntax-validator";

export class MethodIRBuilder extends IRBuilder<IRMethod> {
  private methodDecl: MethodDeclaration;

  constructor(methodDecl: MethodDeclaration, errorManager: ErrorManager) {
    super(errorManager);
    this.methodDecl = methodDecl;
  }

  validate(): boolean {
    const syntaxValidator = new MethodSyntaxValidator(this.methodDecl, this.errorManager);
    return syntaxValidator.validate();
  }

  build(): IRMethod {
    const name = this.methodDecl.getName();
    const decorators = this.methodDecl.getDecorators();

    const visDecorators = decorators.filter(d => VISIBILITY_DECORATORS.includes(d.getName()));
    const stateDecorators = decorators.filter(d => STATE_MUTABILITY_DECORATORS.includes(d.getName()));

    const visibility = visDecorators[0]?.getName()?.toLowerCase() ?? "public";
    const stateMutability = stateDecorators[0]?.getName()?.toLowerCase() ?? "nonpayable";

    const inputs = this.methodDecl.getParameters().map((param) => ({
      name: param.getName(),
      type: param.getType().getText(),
    }));

    const returnType = this.methodDecl.getReturnType().getText();
    const body = this.methodDecl.getBodyOrThrow() as Block;
    
    const irBody = body.getStatements().map(stmt => {
      const statementBuilder = new StatementIRBuilder(stmt, this.errorManager);
      return statementBuilder.build();
    });

    return {
      name,
      visibility,
      inputs,
      outputs: returnType === "void" ? [] : [{ type: returnType }],
      stateMutability,
      ir: irBody
    };
  }
}
