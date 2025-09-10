import { PropertyDeclaration } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRVariable, IRArrayStaticVar, IRArrayDynamicVar } from "@/cli/types/ir.types.js";
import { inferType } from "@/cli/utils/inferType.js";

import { PropertySyntaxValidator } from "./syntax-validator.js";
import { convertType } from "../../builder/build-abi.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { parseName } from "../shared/utils/parse-this.js";

/**
 * Extracts generic types from mapping declarations
 * Examples:
 *   "Mapping<U256, Address>" → { keyType: "U256", valueType: "Address" }
 *   "MappingNested<Address, Address, boolean>" → { keyType1: "Address", keyType2: "Address", valueType: "boolean" }
 */
function extractArrayTypes(typeText: string): {
  elementType?: string;
  length?: number;
  isStatic: boolean;
} {
  // Handle static arrays like U256[3]
  const staticMatch = typeText.match(/^([A-Za-z0-9_]+)\[(\d+)\]$/);
  if (staticMatch) {
    return {
      elementType: staticMatch[1],
      length: parseInt(staticMatch[2]),
      isStatic: true,
    };
  }

  // Handle dynamic arrays like U256[]
  const dynamicMatch = typeText.match(/^([A-Za-z0-9_]+)\[\]$/);
  if (dynamicMatch) {
    return {
      elementType: dynamicMatch[1],
      isStatic: false,
    };
  }

  return { isStatic: false };
}

function extractMappingTypes(typeText: string): {
  keyType?: string;
  valueType?: string;
  keyType1?: string;
  keyType2?: string;
} {
  const cleanType = typeText.replace(/\s/g, "");

  // Handle MappingNested<K1,K2,V>
  if (cleanType.startsWith("MappingNested<")) {
    const nestedMatch = cleanType.match(/^MappingNested<(.+)>$/);
    if (nestedMatch) {
      const types = nestedMatch[1].split(",");
      if (types.length === 3) {
        return {
          keyType1: types[0],
          keyType2: types[1],
          valueType: types[2],
        };
      }
    }
  }

  // Handle regular Mapping<K,V>
  if (cleanType.startsWith("Mapping<")) {
    const mappingMatch = cleanType.match(/^Mapping<(.+)>$/);
    if (mappingMatch) {
      const types = mappingMatch[1].split(",");
      if (types.length === 2) {
        return {
          keyType: types[0],
          valueType: types[1],
        };
      }
    }
  }

  return {};
}

export class PropertyIRBuilder extends IRBuilder<IRVariable> {
  private property: PropertyDeclaration;

  constructor(property: PropertyDeclaration) {
    super(property);
    this.property = property;
  }

  validate(): boolean {
    const syntaxValidator = new PropertySyntaxValidator(this.property);
    return syntaxValidator.validate();
  }

  buildIR(): IRVariable {
    const typeInferred = inferType(this.symbolTable, this.property.getType().getText());
    const { name, type } = parseName(this.property.getText(), typeInferred);

    const fullTypeText = this.property.getType().getText();
    const typeNodeText = this.property.getTypeNode()?.getText() || "";
    const arrayInfo = extractArrayTypes(typeNodeText);
    const mappingTypes = extractMappingTypes(fullTypeText);

    let correctAbiType: AbiType;
    if (arrayInfo.isStatic && arrayInfo.elementType && arrayInfo.length) {
      correctAbiType = AbiType.ArrayStatic;
    } else if (!arrayInfo.isStatic && arrayInfo.elementType) {
      correctAbiType = AbiType.ArrayDynamic;
    } else {
      correctAbiType = convertType(this.symbolTable, type);
    }

    this.symbolTable.declareVariable(name, {
      name,
      type: correctAbiType,
      scope: "storage",
      dynamicType: type,
      length: arrayInfo.isStatic ? arrayInfo.length : undefined,
    });

    if (arrayInfo.isStatic && arrayInfo.elementType && arrayInfo.length) {
      const arrayVar: IRArrayStaticVar = {
        name,
        type: AbiType.ArrayStatic,
        slot: this.slotManager.getSlotForVariable(name),
        elementType: arrayInfo.elementType,
        length: arrayInfo.length,
        kind: "array_static",
      };
      return arrayVar;
    }

    if (!arrayInfo.isStatic && arrayInfo.elementType) {
      const arrayVar: IRArrayDynamicVar = {
        name,
        type: AbiType.ArrayDynamic,
        slot: this.slotManager.getSlotForVariable(name),
        elementType: arrayInfo.elementType,
        kind: "array_dynamic",
      };
      return arrayVar;
    }

    if (type === AbiType.MappingNested || type.startsWith("MappingNested")) {
      const variable: IRVariable = {
        name,
        type: AbiType.MappingNested,
        slot: this.slotManager.getSlotForVariable(name),
        keyType1: mappingTypes.keyType1 || "Address",
        keyType2: mappingTypes.keyType2 || "Address",
        valueType: mappingTypes.valueType || "U256",
        kind: "mapping2",
      };

      return variable;
    }

    if (type === AbiType.Mapping || type.startsWith("Mapping")) {
      const variable: IRVariable = {
        name,
        type: AbiType.Mapping,
        slot: this.slotManager.getSlotForVariable(name),
        keyType: mappingTypes.keyType || "Address",
        valueType: mappingTypes.valueType || "U256",
        kind: "mapping",
      };

      return variable;
    }

    const struct = this.symbolTable.getStructTemplateByName(type);

    return {
      name,
      type: struct ? AbiType.Struct : convertType(this.symbolTable, type),
      originalType: struct ? type : undefined,
      slot: this.slotManager.getSlotForVariable(name),
      kind: "simple",
    };
  }
}
