import { PropertyDeclaration } from "ts-morph";

import { IRVariable } from "@/cli/types/ir.types.js";
import { inferType } from "@/cli/utils/inferType.js";

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
    const [name] = this.property.getName().split(":");
    const type = inferType(this.property.getType().getText());
    this.symbolTable.declareVariable(name, { name, type, scope: "storage" });
  
    if (type === "mapping2") {
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

    if (type === "mapping") {
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
      type,
      slot: this.slot,
      kind: "simple",
    };
  }
}
