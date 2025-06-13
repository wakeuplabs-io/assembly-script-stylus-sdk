import { ClassDeclaration } from "ts-morph";

import { IREvent, IREventField } from "../../../../types/ir.types.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class EventIRBuilder extends IRBuilder<IREvent> {
  private eventClass: ClassDeclaration;

  constructor(eventClass: ClassDeclaration) {
    super(eventClass);
    this.eventClass = eventClass; 
  }

  validate(): boolean {
    const properties = this.eventClass.getProperties();
    
    if (properties.length === 0) {
      this.errorManager.addSemanticError(
        "EVENT_NO_FIELDS",
        this.eventClass.getSourceFile().getFilePath(),
        this.eventClass.getStartLineNumber(),
        [`El evento ${this.eventClass.getName()} debe tener al menos un campo`]
      );
      return false;
    }

    return true;
  }
  buildIR(): IREvent {
    const name = this.eventClass.getName() || "AnonymousEvent";
    const fields: IREventField[] = [];

    this.eventClass.getProperties().forEach(property => {
      const propertyName = property.getName();
      const propertyType = property.getType().getText();
      
      const decorators = property.getDecorators();
      const isIndexed = decorators.some(decorator => decorator.getName() === 'Indexed');

      fields.push({
        name: propertyName,
        type: propertyType,
        indexed: isIndexed
      });
    });

    return {
      name,
      fields
    };
  }
}
