import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression, Call } from "@/cli/types/ir.types.js";
import { VariableSymbol } from "@/cli/types/symbol-table.types.js";

import { SymbolTableStack } from "../shared/symbol-table.js";
import { parseThis } from "../shared/utils/parse-this.js";
import { StructBaseBuilder } from "../struct/struct-base-builder.js";

export class StructMemberBuilder extends StructBaseBuilder {
  constructor(symbolTable: SymbolTableStack) {
    super(symbolTable);
  }

  buildIR(
  objectIR: IRExpression,
  fieldName: string,
  variable: VariableSymbol
): IRExpression {
  const propertyName = parseThis(fieldName);
  const { field, struct, structTemplate } = this.getStructInfo(variable.name, propertyName);

  if (objectIR.kind === "var") {
    return {
      kind: "call",
      target: `${structTemplate?.name}_get_${propertyName}`,
      args: [objectIR],
      returnType: field?.type as AbiType,
      scope: "storage",
      originalType: struct?.dynamicType,
    } as Call;
  }
  
  return {
    kind: "call",
    target: `${variable.name}_get_${propertyName}`,
    args: [objectIR],
    returnType: AbiType.Uint256,
    scope: objectIR.kind === "call"&& objectIR.scope ? objectIR.scope : "memory",
    originalType: variable.name,
  } as Call;

 }
}