import { PropertyDeclaration } from "ts-morph";

import { IRVariable } from "@/cli/types/ir.types.js";

import { PropertySyntaxValidator } from "./syntax-validator.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class PropertyIRBuilder extends IRBuilder<IRVariable> {
  private property: PropertyDeclaration;
  private slot: number;

  constructor(property: PropertyDeclaration, slot: number) {
    super(property);
    this.property = property;
    this.slot = slot;
  }

  validate(): boolean {
    const syntaxValidator = new PropertySyntaxValidator(this.property);
    return syntaxValidator.validate();
  }

  buildIR(): IRVariable {
    const [name, type] = this.property.getName().split(":");
    const typeText = type ?? "any";
    const isMapping = /^Mapping(<|$)/.test(typeText);
    this.symbolTable.declareVariable(name, { name, type: typeText, scope: "storage" });
  
    if (/^Mapping2(<|$)/.test(typeText)) {
      return {
        name,
        type: "mapping2",
        slot: this.slot,
        keyType1: "Address",
        keyType2: "Address",
        valueType: "U256",
        kind: "mapping2",
      };
    }

    if (isMapping) {
      return {
        name,
        type: "mapping",
        slot: this.slot,
        keyType: "Address",
        valueType: "U256",
        kind: "mapping",
      };
    }

    return {
      name,
      type: typeText,
      slot: this.slot,
      kind: "simple",
    };
  }
}
