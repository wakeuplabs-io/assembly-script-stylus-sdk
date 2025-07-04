import path from "path";

import { ctx } from "@/cli/shared/compilation-context.js";
import { AbiItem, AbiInput, AbiOutput, AbiType, AbiComponent } from "@/cli/types/abi.types.js";
import { IRContract } from "@/cli/types/ir.types.js";
import { ABI_PATH } from "@/cli/utils/constants.js";
import { writeFile } from "@/cli/utils/fs.js";

import { extractStructName, convertBasicType } from "../analyzers/struct/struct-utils.js";
import { generateErrorABI } from "../transformers/error/error-transformer.js";

export function buildAbi(targetPath: string, contract: IRContract) {
  const abi: AbiItem[] = [];

  for (const method of contract.methods) {
    if (method.visibility !== "public" && method.visibility !== "external") continue;

    const inputs: AbiInput[] = method.inputs.map((param) => {
      const typeToConvert = param.originalType || param.type;
      const converted = convertTypeWithComponents(typeToConvert as string);
      return {
        name: param.name,
        type: converted.type,
        ...(converted.components && { components: converted.components })
      };
    });

    const outputs: AbiOutput[] = method.outputs.map((param) => {
      const typeToConvert = param.originalType || param.type;
      const converted = convertTypeWithComponents(typeToConvert as string);
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

  if (contract.constructor) {
     // TODO: rethink this
    abi.push({
      type: "function",
      name: "deploy",
      stateMutability: "nonpayable",
      inputs: contract.constructor.inputs.map((param) => {
        const typeToConvert = param.originalType || param.type;
        const converted = convertTypeWithComponents(typeToConvert as string);
        return {
          name: param.name,
          type: converted.type,
          ...(converted.components && { components: converted.components })
        };
      }),
      outputs: [],
    });
  }

  // Add custom errors to ABI
  const errorABI = generateErrorABI(contract);
  abi.push(...errorABI);

  const abiPath = path.join(targetPath, ABI_PATH, `${contract.name}-abi.json`);
  writeFile(abiPath, JSON.stringify(abi, null, 2));
}

/**
 * Converts a struct to its ABI tuple representation with components
 */
function convertStructToTuple(structName: string): { type: AbiType; components: AbiComponent[] } | null {
  const struct = ctx.structRegistry.get(structName);
  if (!struct) {
    return null;
  }

  const components: AbiComponent[] = struct.fields.map(field => {
    const convertedField = convertTypeWithComponents(field.type);
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
function convertTypeWithComponents(type: string): { type: AbiType; components?: AbiComponent[] } {
  const basicType = convertBasicType(type);
  if (basicType) {
    return { type: basicType };
  }
  const structName = extractStructName(type);
  const structTuple = convertStructToTuple(structName);
  
  if (structTuple) {
    return structTuple;
  }
  return { type: AbiType.Unknown };
}

export function convertType(type: string): AbiType {
  const result = convertTypeWithComponents(type);
  return result.type as AbiType;
}
