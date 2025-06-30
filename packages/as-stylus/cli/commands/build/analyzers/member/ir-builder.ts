import { PropertyAccessExpression } from "ts-morph";

import { ctx } from "@/cli/shared/compilation-context.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { isExpressionOfStructType } from "../struct/struct-utils.js";

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
    const expressionType = this.expression.getType().getText();

    const structInfo = isExpressionOfStructType(objectIR);
    
    if (structInfo.isStruct && structInfo.structName) {
      const struct = ctx.structRegistry.get(structInfo.structName);
      if (struct) {
        const field = struct.fields.find(f => f.name === propertyName);
        if (field) {
          
          let scope: "storage" | "memory" = "storage";
          if (objectIR.kind === "var" && (objectIR as any).scope === "memory") {
            scope = "memory";
          }
          
          return {
            kind: "call",
            target: `${structInfo.structName}_get_${propertyName}`,
            args: [objectIR],
            returnType: expressionType as AbiType,
            scope: scope
          };
        }
      }
    }

    return {
      kind: "member",
      object: objectIR,
      property: propertyName,
      type: expressionType as AbiType,
    };
  }
}