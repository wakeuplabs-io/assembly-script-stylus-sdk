import { Block, MethodDeclaration } from "ts-morph";

import { AbiType, STATE_MUTABILITY_DECORATORS, VISIBILITY_DECORATORS } from "@/cli/types/abi.types.js";
import { IRMethod } from "@/cli/types/ir.types.js";

import { MethodSemanticValidator } from "./semantic-validator.js";
import { MethodSyntaxValidator } from "./syntax-validator.js";
import { convertType } from "../../builder/build-abi.js";
import { ArgumentIRBuilder } from "../argument/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { StatementIRBuilder } from "../statement/ir-builder.js";

export class MethodIRBuilder extends IRBuilder<IRMethod> {
  private methodDecl: MethodDeclaration;
  private names: string[];

  constructor(methodDecl: MethodDeclaration, names: string[]) {
    super(methodDecl);
    this.methodDecl = methodDecl;
    this.names = names;
  }

  validate(): boolean {
    const syntaxValidator = new MethodSyntaxValidator(this.methodDecl);
    const semanticValidator = new MethodSemanticValidator(this.methodDecl, this.names);
    return syntaxValidator.validate() && semanticValidator.validate();
  }

  buildIR(): IRMethod {
    this.symbolTable.enterScope();
    const name = this.methodDecl.getName();
    const decorators = this.methodDecl.getDecorators();

    const visDecorators = decorators.filter((d) => VISIBILITY_DECORATORS.includes(d.getName()));
    const stateDecorators = decorators.filter((d) =>
      STATE_MUTABILITY_DECORATORS.includes(d.getName()),
    );

    const visibility = visDecorators[0]?.getName()?.toLowerCase() ?? "public";
    const stateMutability = stateDecorators[0]?.getName()?.toLowerCase() ?? "nonpayable";

    const inputs = this.methodDecl.getParameters().map((param) => {
      const argumentBuilder = new ArgumentIRBuilder(param);
      return argumentBuilder.validateAndBuildIR();
    });

    const returnType = this.methodDecl.getReturnType().getText();
    const body = this.methodDecl.getBodyOrThrow() as Block;
    const irBody = body.getStatements().map((stmt) => {
      const statementBuilder = new StatementIRBuilder(stmt);
      return statementBuilder.validateAndBuildIR();
    });

    this.symbolTable.exitScope();
    return {
      name,
      visibility,
      inputs,
      outputs: returnType === AbiType.Void ? [] : [{ type: convertType(returnType) }],
      stateMutability,
      ir: irBody,
    };
  }
}
