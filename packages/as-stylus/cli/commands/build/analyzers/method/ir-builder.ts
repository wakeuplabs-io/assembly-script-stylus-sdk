import { Block, MethodDeclaration } from "ts-morph";

import { AbiType, StateMutability, Visibility, AbiOutput } from "@/cli/types/abi.types.js";
import { IRMethod } from "@/cli/types/ir.types.js";

import { MethodSemanticValidator } from "./semantic-validator.js";
import { MethodSyntaxValidator } from "./syntax-validator.js";
import { ArgumentIRBuilder } from "../argument/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { StatementIRBuilder } from "../statement/ir-builder.js";
import { convertTypeForIR } from "../struct/struct-utils.js";

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

    const visDecorators = decorators.filter((d) => Object.values(Visibility).includes(d.getName().toLowerCase() as Visibility));
    const stateDecorators = decorators.filter((d) => Object.values(StateMutability).includes(d.getName().toLowerCase() as StateMutability));

    const visibility = visDecorators[0]?.getName()?.toLowerCase() ?? Visibility.PUBLIC;
    const stateMutability = stateDecorators[0]?.getName()?.toLowerCase() ?? StateMutability.NONPAYABLE;
    
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

    const outputs: AbiOutput[] = returnType === AbiType.Void ? [] : (() => {
      const convertedType = convertTypeForIR(returnType);
      return [{ 
        type: convertedType.type,
        ...(convertedType.originalType && { originalType: convertedType.originalType })
      }];
    })();

    this.symbolTable.exitScope();
    return {
      name,
      visibility: visibility as Visibility,
      inputs,
      outputs,
      stateMutability: stateMutability as StateMutability,
      ir: irBody,
    };
  }
}
