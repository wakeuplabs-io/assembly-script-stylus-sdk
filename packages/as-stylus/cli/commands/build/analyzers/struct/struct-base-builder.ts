import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { isPrimitiveType } from "./struct-utils.js";
import { SymbolTableStack } from "../shared/symbol-table.js";

export class StructBaseBuilder  {
  constructor(protected symbolTable: SymbolTableStack) {}

  protected getStructInfo(structName: string, fieldName: string) {
    const struct = this.symbolTable.lookup(structName);
    const structIR = this.symbolTable.getStructTemplateByName(struct?.dynamicType ?? '');

    if (!structIR) {
      return {
        fieldType: AbiType.Void,
        struct: null,
      };
    }

    const field = structIR.fields.find(f => f.name === fieldName);

    return {
      field: field ?? null,
      fieldType: (field?.type ?? AbiType.Void) as AbiType,
      struct,
      structTemplate: structIR,
    };
  }

  protected wrapValueWithCopyIfNeeded(valueExpr: IRExpression, fieldType?: AbiType): IRExpression {
    if (!fieldType || !isPrimitiveType(fieldType)) {
      return valueExpr;
    }
  
    const copyTargets = {
      [AbiType.Uint256]: "U256.copy",
      [AbiType.Bool]: "boolean.copy",
      [AbiType.Address]: "Address.copy",
    };
  
    const copyTarget = copyTargets[fieldType as keyof typeof copyTargets];
    if (!copyTarget) {
      return valueExpr;
    }
  
    return {
        kind: "call",
        target: copyTarget,
        args: [valueExpr],
        type: AbiType.Function,
        returnType: fieldType,
        scope: "memory"
    };
  }
}