import { PropertyDeclaration } from "ts-morph";

import { IRVariable } from "@/cli/types/ir.types.js";

import { PropertySyntaxValidator } from "./syntax-validator.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class PropertyIRBuilder extends IRBuilder<IRVariable> {
  private property: PropertyDeclaration;
  private slot: number;

  constructor(property: PropertyDeclaration, slot: number, errorManager: ErrorManager) {
    super(errorManager);
    this.property = property;
    this.slot = slot;
  }

  validate(): boolean {
    const syntaxValidator = new PropertySyntaxValidator(this.property, this.errorManager);
    return syntaxValidator.validate();
  }

  build() {
    const name = this.property.getName();
    const type = this.property.getType().getText();

    return {
      name,
      type,
      slot: this.slot,
    };
  }
}
