import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression, Call, Variable, IRStruct } from "@/cli/types/ir.types.js";
import { SymbolInfo, VariableSymbol } from "@/cli/types/symbol-table.types.js";

import { SlotManager } from "../shared/slot-manager.js";
import { SymbolTableStack } from "../shared/symbol-table.js";
import { parseThis } from "../shared/utils/parse-this.js";
import { StructBaseBuilder } from "../struct/struct-base-builder.js";

export class StructMemberBuilder extends StructBaseBuilder {
  private slotManager: SlotManager;

  constructor(symbolTable: SymbolTableStack, slotManager: SlotManager) {
    super(symbolTable);
    this.slotManager = slotManager;
  }

  private buildTarget(
    objectIR: Variable,
    propertyName: string,
    struct: SymbolInfo | undefined,
    structTemplate: IRStruct | undefined,
  ) {
    let scope = "";
    let name = `${objectIR.name}.${propertyName}`;
    if (struct?.scope === "memory") {
      scope = "_memory";
      name = objectIR.name;
    }

    return { target: `${structTemplate?.name}${scope}_get_${propertyName}`, name };
  }

  private buildVariableIR(
    objectIR: Variable,
    variable: VariableSymbol,
    propertyName: string,
  ): IRExpression {
    const { field, struct, structTemplate } = this.getStructInfo(variable.name, propertyName);
    const slot = this.slotManager.calculateStructFieldSlot(struct!, propertyName, structTemplate!);

    const { name, target } = this.buildTarget(objectIR, propertyName, struct!, structTemplate);

    return {
      kind: "call",
      target,
      args: [
        {
          kind: "var",
          name,
          type: objectIR.type,
          originalType: structTemplate?.name,
          slot,
          scope: objectIR.scope,
        } as IRExpression,
      ],
      returnType: field?.type as AbiType,
      scope: "storage",
      originalType: struct?.dynamicType,
    } as Call;
  }

  buildIR(objectIR: Variable, fieldName: string, variable: VariableSymbol): IRExpression {
    const propertyName = parseThis(fieldName);
    if (objectIR.kind === "var") {
      return this.buildVariableIR(objectIR, variable as VariableSymbol, propertyName);
    }

    const { struct } = this.getStructInfo(variable.name, propertyName);
    const { target } = this.buildTarget(objectIR, propertyName, struct!, undefined);

    return {
      kind: "call",
      target,
      args: [objectIR],
      returnType: AbiType.Uint256,
      scope: objectIR.kind === "call" && objectIR.scope ? objectIR.scope : "memory",
      originalType: variable.name,
    } as Call;
  }
}
