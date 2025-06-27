import { PropertyAccessExpression } from "ts-morph";

import { ctx } from "@/cli/shared/compilation-context.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { getExpressionType, isExpressionOfStructType } from "../struct/struct-utils.js";

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

    // console.log("🔍 MemberIRBuilder processing:", {
    //   propertyName,
    //   objectType: getExpressionType(objectIR),
    //   expressionType
    // });

    const structInfo = isExpressionOfStructType(objectIR);
    
    if (structInfo.isStruct && structInfo.structName) {
      // console.log(`Detected struct field access: ${structInfo.structName}.${propertyName}`);
      const struct = ctx.structRegistry.get(structInfo.structName);
      if (struct) {
        const field = struct.fields.find(f => f.name === propertyName);
        if (field) {
          // console.log(`Generating getter call: ${structInfo.structName}_get_${propertyName}`);
          
          return {
            kind: "call",
            target: `${structInfo.structName}_get_${propertyName}`,
            args: [objectIR],
            returnType: expressionType,
            scope: "storage"
          };
        }
      }
      
      // console.log(`Field ${propertyName} not found in struct ${structInfo.structName}`);
    }

    // console.log("Generating regular member access");
    
    return {
      kind: "member",
      object: objectIR,
      property: propertyName,
      type: expressionType
    };
  }
} 