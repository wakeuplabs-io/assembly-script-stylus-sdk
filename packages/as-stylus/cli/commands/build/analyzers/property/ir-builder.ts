import { PropertyDeclaration } from "ts-morph";
import { ErrorManager } from "../shared/error-manager";
import { IRBuilder } from "../shared/ir-builder";
import { IRVariable } from "@/cli/types/ir.types";
import { PropertySyntaxValidator } from "./syntax-validator";

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
      slot: this.slot
    };
  }
}

