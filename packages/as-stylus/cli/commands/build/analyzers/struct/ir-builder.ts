import { ClassDeclaration } from "ts-morph";

import { calculateFieldLayout } from "./type-utils.js";
import { IRStruct, IRStructField } from "../../../../types/ir.types.js";
import { convertType } from "../../builder/build-abi.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class StructIRBuilder extends IRBuilder<IRStruct> {
  private structClass: ClassDeclaration;
  private static structRegistry = new Map<string, IRStruct>();

  constructor(structClass: ClassDeclaration) {
    super(structClass);
    this.structClass = structClass;
  }

  validate(): boolean {
    const properties = this.structClass.getProperties();
    
    if (properties.length === 0) {
      this.errorManager.addSemanticError(
        "STRUCT_NO_FIELDS",
        this.structClass.getSourceFile().getFilePath(),
        this.structClass.getStartLineNumber(),
        [`El struct ${this.structClass.getName()} debe tener al menos un campo`]
      );
      return false;
    }

    const structName = this.structClass.getName() || "AnonymousStruct";
    if (this.hasRecursiveTypes(structName, properties)) {
      return false;
    }

    return true;
  }

  buildIR(): IRStruct {
    const name = this.structClass.getName() || "AnonymousStruct";
    
    const basicFields = this.structClass.getProperties().map(property => ({
      name: property.getName(),
      type: convertType(property.getType().getText())
    }));

    const layout = calculateFieldLayout(basicFields);
    
    const fields: IRStructField[] = layout.fields.map(field => ({
      name: field.name,
      type: field.type,
      offset: field.offset,
      size: field.size,
      dynamic: field.dynamic,
    }));

    const irStruct: IRStruct = {
      name,
      fields,
      size: layout.totalSize,
      dynamic: layout.dynamic,
      alignment: layout.alignment,
    };

    StructIRBuilder.structRegistry.set(name, irStruct);

    return irStruct;
  }

  private hasRecursiveTypes(structName: string, properties: any[]): boolean {
    for (const property of properties) {
      const propertyType = property.getType().getText();
      
      if (propertyType === structName) {
        this.errorManager.addSemanticError(
          "STRUCT_RECURSIVE_TYPE",
          this.structClass.getSourceFile().getFilePath(),
          property.getStartLineNumber(),
          [`El campo ${property.getName()} no puede tener el mismo tipo que el struct ${structName}`]
        );
        return true;
      }
      
      // TODO: Detect indirect cycles (A -> B -> A)
      // This would require a deeper analysis of the dependency graph
    }
    
    return false;
  }

  static getRegisteredStruct(name: string): IRStruct | undefined {
    return StructIRBuilder.structRegistry.get(name);
  }

  static getAllRegisteredStructs(): IRStruct[] {
    return Array.from(StructIRBuilder.structRegistry.values());
  }
} 