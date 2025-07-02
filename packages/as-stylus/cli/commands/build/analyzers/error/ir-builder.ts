import { ClassDeclaration } from "ts-morph";
import { toFunctionSelector } from "viem";

import { IRErrorDecl, IRErrorField } from "@/cli/types/ir.types.js";

import { convertType } from "../../builder/build-abi.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class ErrorIRBuilder extends IRBuilder<IRErrorDecl> {
  private errorClass: ClassDeclaration;

  constructor(errorClass: ClassDeclaration) {
    super(errorClass);
    this.errorClass = errorClass;
  }

  validate(): boolean {
    return true;
  }

  buildIR(): IRErrorDecl {
    const name = this.errorClass.getName() || "AnonymousError";
    const fields: IRErrorField[] = [];

    this.errorClass.getProperties().forEach(property => {
      const fieldName = property.getName();
      const fieldType = property.getType().getText();

      fields.push({
        name: fieldName,
        type: fieldType
      });
    });

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
    const paramTypes = fields.map(field => convertType(field.type));
    return `${name}(${paramTypes.join(',')})`;
  }

  private calculateErrorSelector(signature: string): string {
    return toFunctionSelector(signature);
  }

} 