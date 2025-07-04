import { PropertyAccessExpression } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression, Call, Member } from "@/cli/types/ir.types.js";

import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { isExpressionOfStructType, getStructInfoFromVariableName } from "../struct/struct-utils.js";

export class MemberIRBuilder extends IRBuilder<IRExpression> {
  private expression: PropertyAccessExpression;

  constructor(expression: PropertyAccessExpression) {
    super(expression);
    this.expression = expression;
  }

  validate(): boolean {
    return true;
  }

  buildIR(): IRExpression {
    const objectIR = new ExpressionIRBuilder(this.expression.getExpression()).validateAndBuildIR();
    const propertyName = this.expression.getName();

    const structInfo = isExpressionOfStructType(objectIR);
    if (structInfo.isStruct && structInfo.structName) {
      if (objectIR.kind === "var") {
        const variableInfo = getStructInfoFromVariableName(objectIR.name);
        
        if (variableInfo.isStruct) {
          return {
            kind: "call",
            target: `${structInfo.structName}_get_${propertyName}`,
            args: [objectIR],
            returnType: AbiType.Uint256,
            scope: "storage",
            originalType: structInfo.structName,
          } as Call;
        }
      }
      
      return {
        kind: "call",
        target: `${structInfo.structName}_get_${propertyName}`,
        args: [objectIR],
        returnType: AbiType.Uint256,
        scope: (objectIR.kind === "var" || objectIR.kind === "call") && objectIR.scope ? objectIR.scope : "memory",
        originalType: structInfo.structName,
      } as Call;
    }

    // Regular member access
    return {
      kind: "member",
      object: objectIR,
      property: propertyName,
      type: AbiType.Uint256,
      originalType: (objectIR.kind === "var" || objectIR.kind === "call" || objectIR.kind === "member") ? objectIR.originalType : undefined,
    } as Member;
  }
}