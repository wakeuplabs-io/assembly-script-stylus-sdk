import { ClassDeclaration, CallExpression, SyntaxKind, TupleTypeNode, NamedTupleMember } from "ts-morph";
import { toFunctionSelector } from "viem";

import { IRErrorDecl, IRErrorField } from "@/cli/types/ir.types.js";

import { convertType } from "../../builder/build-abi.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class ErrorIRBuilder extends IRBuilder<IRErrorDecl> {
  private errorClass: ClassDeclaration;
  private errorFactoryCall?: CallExpression;

  constructor(errorClass: ClassDeclaration) {
    super(errorClass);
    this.errorClass = errorClass;
    this.errorFactoryCall = (this.errorClass as ClassDeclaration & { errorFactoryCall?: CallExpression }).errorFactoryCall;
  }

  validate(): boolean {
    return true;
  }

  buildIR(): IRErrorDecl {
    return this.buildErrorFactoryIR();
  }

  private buildErrorFactoryIR(): IRErrorDecl {
    const name = this.errorClass.getName() || "AnonymousError";
    const fields: IRErrorField[] = [];

    const typeArgs = this.errorFactoryCall!.getTypeArguments();
    
    if (typeArgs.length > 0) {
      const typeArg = typeArgs[0];

      if (typeArg.getKind() === SyntaxKind.TupleType) {
        const tupleType = typeArg as TupleTypeNode;
        const properties = tupleType.getElements();
        
        properties.forEach((property, index) => {
          if (property.getKind() === SyntaxKind.NamedTupleMember) {
            const namedTupleMember = property as NamedTupleMember;
            const type = namedTupleMember.getText().split(":")[1].replaceAll(" ", "");

            fields.push({
              name: `arg${index}`,
              type: convertType(this.symbolTable, type)
            });
          }
        });
      }
    }

    const signature = this.generateErrorSignature(name, fields);
    const selector = this.calculateErrorSelector(signature);

    return {
      node: "ErrorDeclNode",
      name,
      selector,
      fields
    };
  }

  private generateErrorSignature(name: string, fields: IRErrorField[]): string {
    return `${name}(${fields.map(field => field.type).join(',')})`;
  }

  private calculateErrorSelector(signature: string): string {
    return toFunctionSelector(signature);
  }
} 