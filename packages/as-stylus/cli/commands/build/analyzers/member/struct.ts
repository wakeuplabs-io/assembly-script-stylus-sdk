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

  private calculateSlot(variable: VariableSymbol, fieldName: string) {
    if (variable.scope !== "storage") {
      return undefined;
    }

    const { structTemplate } = this.getStructInfo(variable.name, fieldName);
    const baseSlot = this.slotManager.getSlotForVariable(variable.name);
    const fieldIndex = structTemplate!.fields.findIndex(f => f.name === fieldName);
    if (fieldIndex === -1) {
      throw new Error(`Field ${fieldName} not found in struct ${variable.dynamicType}`);
    }
    return baseSlot + fieldIndex;
  }

  private buildTarget(objectIR: Variable, propertyName: string, struct: SymbolInfo | undefined, structTemplate: IRStruct | undefined) {
    let scope = "";
    let name = objectIR.name;
    if (struct?.scope === "memory") {
      scope = "_memory";
      name = `${objectIR.name}.${propertyName}`;
    }

    return { target: `${structTemplate?.name}${scope}_get_${propertyName}`, name };
  }

  private buildVariableIR(objectIR: Variable, variable: VariableSymbol, propertyName: string): IRExpression {
    const { field, struct, structTemplate } = this.getStructInfo(variable.name, propertyName);
    const slot = this.calculateSlot(variable as VariableSymbol, propertyName);

    const { name, target } = this.buildTarget(objectIR, propertyName, struct!, structTemplate);

    return {
      kind: "call",
      target,
      args: [{
        kind: "var",
        name,
        type: objectIR.type,
        originalType: structTemplate?.name,
        slot,
        scope: objectIR.scope
      } as IRExpression],
      returnType: field?.type as AbiType,
      scope: "storage",
      originalType: struct?.dynamicType,
    } as Call;
  }

  buildIR(
    objectIR: Variable,
    fieldName: string,
    variable: VariableSymbol
  ): IRExpression {
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