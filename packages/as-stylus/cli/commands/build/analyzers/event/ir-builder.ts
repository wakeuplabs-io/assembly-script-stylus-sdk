import { VariableDeclaration, CallExpression, ObjectLiteralExpression, ArrayLiteralExpression, PropertyAssignment } from "ts-morph";

import { IREvent, IREventField } from "../../../../types/ir.types.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class EventIRBuilder extends IRBuilder<IREvent> {
  private eventVariable: VariableDeclaration;

  constructor(eventVariable: VariableDeclaration) {
    super(eventVariable);
    this.eventVariable = eventVariable; 
  }

  validate(): boolean { 

    return true;
  }

  private parseEventConfig(configArg: ObjectLiteralExpression) {
      const getPropValue = (propName: string) => {
        const prop = configArg.getProperty(propName) as PropertyAssignment;
        return prop?.getInitializer();
      };
    
      const indexedInit = getPropValue("indexed") as ArrayLiteralExpression;
      const indexed = indexedInit
        ? indexedInit.getElements().map(e => e.getText() === "true")
        : [];
    
      return { indexed };
    }

  buildIR(): IREvent {
    const initializer = this.eventVariable.getInitializer() as CallExpression;
    const args = initializer.getArguments();
    const { indexed } = this.parseEventConfig(args[0] as ObjectLiteralExpression);
    
    const fields: IREventField[] = [];
    
    indexed.forEach((isIndexed, index) => {
      fields.push({
        name: `arg${index}`,
        type: "any",
        indexed: isIndexed || false
      });
    });

    //TODO: see if the name should be a parameter of the constructor instead
    return {
      name: this.eventVariable.getName(),
      fields
    };
  }
}
