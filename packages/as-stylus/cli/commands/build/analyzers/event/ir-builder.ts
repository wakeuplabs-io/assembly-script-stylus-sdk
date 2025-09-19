import {
  VariableDeclaration,
  CallExpression,
  ObjectLiteralExpression,
  ArrayLiteralExpression,
  PropertyAssignment,
} from "ts-morph";

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
    const indexed = indexedInit ? indexedInit.getElements().map((e) => e.getText() === "true") : [];

    return { indexed };
  }

  private getEventParamsDefinition(definition: string) {
    const fields = definition.split("<")[1]?.split(">")[0]?.replace(/[[\]]/g, "").split(",");

    return fields.reduce<{ name: string; type: string }[]>((acc, field) => {
      const [name, type] = field.split(":").map((s) => s.trim());

      acc.push({ name: name.trim(), type: type.trim() });
      return acc;
    }, []);
  }

  buildIR(): IREvent {
    const initializer = this.eventVariable.getInitializer() as CallExpression;
    const args = initializer.getArguments();
    const { indexed } = this.parseEventConfig(args[0] as ObjectLiteralExpression);

    const fields: IREventField[] = [];
    const fieldsDefined = this.getEventParamsDefinition(initializer.getText());


    indexed.forEach((isIndexed, index) => {
      const field = fieldsDefined[index];

      fields.push({
        name: field.name,
        type: field.type,
        indexed: isIndexed || false,
      });
    });

    //TODO: see if the name should be a parameter of the constructor instead
    return {
      name: this.eventVariable.getName(),
      fields,
    };
  }
}
