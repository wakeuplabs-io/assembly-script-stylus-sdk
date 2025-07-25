import { PropertyDeclaration } from "ts-morph";

import { ctx } from "@/cli/shared/compilation-context.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { IRVariable } from "@/cli/types/ir.types.js";
import { inferType } from "@/cli/utils/inferType.js";

import { PropertySyntaxValidator } from "./syntax-validator.js";
import { convertType } from "../../builder/build-abi.js";
import { IRBuilder } from "../shared/ir-builder.js";

/**
 * Extracts generic types from mapping declarations
 * Examples:
 *   "Mapping<U256, Address>" → { keyType: "U256", valueType: "Address" }
 *   "Mapping2<Address, Address, boolean>" → { keyType1: "Address", keyType2: "Address", valueType: "boolean" }
 */
function extractMappingTypes(typeText: string): {
  keyType?: string;
  valueType?: string;
  keyType1?: string;
  keyType2?: string;
} {
  const cleanType = typeText.replace(/\s/g, "");
  const genericMatch = cleanType.match(/^Mapping2?<(.+)>$/);
  
  if (!genericMatch) {
    return {};
  }
  
  const genericContent = genericMatch[1];
  const types = genericContent.split(',');
  
  if (cleanType.startsWith('Mapping2<') && types.length === 3) {
    return {
      keyType1: types[0],
      keyType2: types[1], 
      valueType: types[2]
    };
  } else if (cleanType.startsWith('Mapping<') && types.length === 2) {
    return {
      keyType: types[0],
      valueType: types[1]
    };
  }
  
  return {};
}

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
  
    const fullTypeText = this.property.getType().getText();
    const mappingTypes = extractMappingTypes(fullTypeText);
    
    if (type === AbiType.Mapping2) {
      const variable: IRVariable = {
        name,
        type: AbiType.Mapping2,
        slot: this.slot,
        keyType1: mappingTypes.keyType1 || "Address",
        keyType2: mappingTypes.keyType2 || "Address", 
        valueType: mappingTypes.valueType || "U256",
        kind: "mapping2",
      };
      
        ctx.mappingTypes.set(name, {
        keyType1: variable.keyType1,
        keyType2: variable.keyType2,
        valueType: variable.valueType
      });
      
      return variable;
    }

    if (type === AbiType.Mapping) {
      const variable: IRVariable = {
        name,
        type: AbiType.Mapping,
        slot: this.slot,
        keyType: mappingTypes.keyType || "Address",
        valueType: mappingTypes.valueType || "U256", 
        kind: "mapping",
      };
      
      ctx.mappingTypes.set(name, {
        keyType: variable.keyType,
        valueType: variable.valueType
      });
      
      return variable;
    }

    const isStructType = ctx.structRegistry.has(type);
    
    if (isStructType) {
      ctx.variableTypes.set(`${ctx.contractName}.${name}`, type);
      ctx.variableTypes.set(name, "struct");
    } else {
      ctx.variableTypes.set(`${ctx.contractName}.${name}`, type);
      ctx.variableTypes.set(name, type);
    }

    return {
      name,
      type: isStructType ? AbiType.Struct : convertType(type),
      originalType: isStructType ? type : undefined,
      slot: this.slot,
      kind: "simple",
    };
  }
}
