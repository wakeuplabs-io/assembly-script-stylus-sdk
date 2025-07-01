import { PropertyDeclaration } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRVariable } from "@/cli/types/ir.types.js";
import { inferType } from "@/cli/utils/inferType.js";

import { PropertySyntaxValidator } from "./syntax-validator.js";
import { convertType } from "../../builder/build-abi.js";
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
    const [name, typeDefined] = this.property.getName().split(":");
    const type = typeDefined ? typeDefined : inferType(this.property.getType().getText());
    this.symbolTable.declareVariable(name, { name, type: convertType(type), scope: "storage" });
  
    if (type === AbiType.Mapping2) {
      return {
        name,
        type: AbiType.Mapping2,
        slot: this.slot,
        keyType1: "Address",
        keyType2: "Address",
        valueType: "U256",
        kind: "mapping2",
      };
    }

    if (type === AbiType.Mapping) {
      return {
        name,
        type: AbiType.Mapping,
        slot: this.slot,
        keyType: "Address",
        valueType: "U256",
        kind: "mapping",
      };
    }

    return {
      name,
      type: convertType(type),
      slot: this.slot,
      kind: "simple",
    };
  }
}
