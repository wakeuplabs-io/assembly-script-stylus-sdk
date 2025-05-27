import { Block, MethodDeclaration } from "ts-morph";

import { STATE_MUTABILITY_DECORATORS, VISIBILITY_DECORATORS } from "@/cli/types/abi.types.js";
import { IRMethod } from "@/cli/types/ir.types.js";

import { MethodSyntaxValidator } from "./syntax-validator.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { StatementIRBuilder } from "../statement/ir-builder.js";
import { ArgumentIRBuilder } from "../argument/ir-builder.js";

export class MethodIRBuilder extends IRBuilder<IRMethod> {
  private methodDecl: MethodDeclaration;
  private names: string[];

  constructor(methodDecl: MethodDeclaration, names: string[], errorManager: ErrorManager) {
    super(errorManager);
    this.methodDecl = methodDecl;
    this.names = names;
  }

  validate(): boolean {
    const syntaxValidator = new MethodSyntaxValidator(this.methodDecl, this.names, this.errorManager);
    return syntaxValidator.validate();
  }

  buildIR(): IRMethod {
    const name = this.methodDecl.getName();
    const decorators = this.methodDecl.getDecorators();

    const visDecorators = decorators.filter((d) => VISIBILITY_DECORATORS.includes(d.getName()));
    const stateDecorators = decorators.filter((d) =>
      STATE_MUTABILITY_DECORATORS.includes(d.getName()),
    );

    const visibility = visDecorators[0]?.getName()?.toLowerCase() ?? "public";
    const stateMutability = stateDecorators[0]?.getName()?.toLowerCase() ?? "nonpayable";

    const inputs = this.methodDecl.getParameters().map((param) => {
      const argumentBuilder = new ArgumentIRBuilder(param, this.errorManager);
      return argumentBuilder.validateAndBuildIR();
    });

    const returnType = this.methodDecl.getReturnType().getText();
    const body = this.methodDecl.getBodyOrThrow() as Block;

    const irBody = body.getStatements().map((stmt) => {
      const statementBuilder = new StatementIRBuilder(stmt, this.errorManager);
      return statementBuilder.validateAndBuildIR();
    });

    return {
      name,
      visibility,
      inputs,
      outputs: returnType === "void" ? [] : [{ type: returnType }],
      stateMutability,
      ir: irBody,
    };
  }
}
