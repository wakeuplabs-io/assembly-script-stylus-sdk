import path from "path";

import { AbiItem, AbiInput, AbiOutput, AbiType, StateMutability , AbiComponent, Visibility } from "@/cli/types/abi.types.js";
import { IRContract, IRStruct } from "@/cli/types/ir.types.js";
import { ABI_PATH } from "@/cli/utils/constants.js";
import { writeFile } from "@/cli/utils/fs.js";

import { SymbolTableStack } from "../analyzers/shared/symbol-table.js";
import { extractStructName, convertBasicType } from "../analyzers/struct/struct-utils.js";
import { generateErrorABI } from "../transformers/error/error-transformer.js";

const createAbiRepresentation = (contract: IRContract, isParent: boolean = false): AbiItem[] => {
  const abi: AbiItem[] = [];

  for (const method of contract.methods) {
    if (method.visibility !== Visibility.PUBLIC && method.visibility !== Visibility.EXTERNAL) continue;

    const inputs: AbiInput[] = method.inputs.map((param) => {
      const typeToConvert = param.originalType || param.type;
      const converted = convertTypeWithComponents(contract.symbolTable, typeToConvert as string);
      return {
        name: param.name,
        type: converted.type,
        ...(converted.components && { components: converted.components })
      };
    });

    const outputs: AbiOutput[] = method.outputs.map((param) => {
      const typeToConvert = param.originalType || param.type;
      const converted = convertTypeWithComponents(contract.symbolTable, typeToConvert as string);
      return {
        name: param.name || undefined,
        type: converted.type,
        ...(converted.components && { components: converted.components })
      };
    });
    abi.push({
      name: method.name,
      type: "function",
      stateMutability: method.stateMutability,
      inputs,
      outputs,
    });
  }

  if (contract.constructor && !isParent) {
    abi.push({
      type: "function",
      name: contract.name + "_constructor",
      stateMutability: StateMutability.NONPAYABLE,
      inputs: contract.constructor.inputs.map((param) => {
        const typeToConvert = param.originalType || param.type;
        const converted = convertTypeWithComponents(contract.symbolTable, typeToConvert as string);
        return {
          name: param.name,
          type: converted.type,
          ...(converted.components && { components: converted.components })
        };
      }),
      outputs: [],
    });
  }

  const errorABI = generateErrorABI(contract);
  abi.push(...errorABI);

  return abi;
};

export function buildAbi(targetPath: string, contract: IRContract) {
  const abi: AbiItem[] = [];

  const abiRepresentation = createAbiRepresentation(contract);
  abi.push(...abiRepresentation);

  const abiPath = path.join(targetPath, ABI_PATH, `${contract.name}-abi.json`);
  writeFile(abiPath, JSON.stringify(abi, null, 2));
}

/**
 * Converts a struct to its ABI tuple representation with components
 */
function convertStructToTuple(symbolTable: SymbolTableStack, structName: string | null, struct: IRStruct): { type: AbiType; components: AbiComponent[] } | null {
  if (!structName) {
    return null;
  }

  const components: AbiComponent[] = struct.fields.map(field => {
    const convertedField = convertTypeWithComponents(symbolTable, field.type);
    return {
      name: field.name,
      type: convertedField.type,
      ...(convertedField.components && { components: convertedField.components })
    } as AbiComponent;
  });

  return {
    type: AbiType.Tuple,
    components
  };
}

/**
 * Converts a type to ABI format, handling structs as tuples with components
 */
function convertTypeWithComponents(symbolTable: SymbolTableStack, type: string): { type: AbiType; components?: AbiComponent[] } {
  const basicType = convertBasicType(type);
  if (basicType) {
    return { type: basicType };
  }

  const structName = extractStructName(type);
  if (!structName) {
    return { type: AbiType.Unknown };
  }

  const struct = symbolTable.getStructTemplateByName(structName);
  if (!struct) {
    return { type: AbiType.Unknown };
  }

  const structTuple = convertStructToTuple(symbolTable, structName, struct);
  
  if (structTuple) {
    return structTuple;
  }
  return { type: AbiType.Unknown };
}

export function convertType(symbolTable: SymbolTableStack, type: string): AbiType {
  let input = type;
  if (type.startsWith("import(")) {
    const match = type.match(/(?<=\)\.)\w+/);
    input = match?.[0] || "";
  }

  const result = convertTypeWithComponents(symbolTable, input);

  if (result.type === AbiType.Tuple) {
    return AbiType.Struct;
  }
  return result.type as AbiType;
}
