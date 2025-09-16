import { PropertyAccessExpression } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression, Member, Variable } from "@/cli/types/ir.types.js";
import { VariableSymbol } from "@/cli/types/symbol-table.types.js";

import { StructMemberBuilder } from "./struct.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { parseThis } from "../shared/utils/parse-this.js";

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
    const propertyName = parseThis(this.expression.getName());
    const variable = this.symbolTable.lookup((objectIR as Variable)?.name || "");
    const struct = this.symbolTable.getStructTemplateByName(variable?.dynamicType ?? "");

    if (struct && variable) {
      return new StructMemberBuilder(this.symbolTable, this.slotManager).buildIR(
        objectIR as Variable,
        propertyName,
        variable as VariableSymbol,
      );
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