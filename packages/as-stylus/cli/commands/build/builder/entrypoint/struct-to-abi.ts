import { AbiType } from "@/cli/types/abi.types.js";
import { IRContract, IRMethod, IRStruct } from "@/cli/types/ir.types.js";

import { extractStructName } from "../../analyzers/struct/struct-utils.js";

function generateGetDynamicSize(structInfo: IRStruct): string {
  const isDynamic = structInfo.dynamic;
  const fieldsCalculations = structInfo.fields.map((field, index) => {
    if (field.type === AbiType.String) {
      return `
  const len${index} = StructMemory.getStringLength(memoryStruct, ${field.offset});
  const paddedLen${index} = (len${index} + 31) & ~31;
  totalSize += 32 + paddedLen${index};
  `;
    }
    return "";
  }).filter(val => val.length > 0).join("");

  return `
function ${structInfo.name}_getDynamicSize(memoryStruct: usize): u32 {
  let totalSize = ${structInfo.size};
  ${fieldsCalculations}
  return ${isDynamic ? "totalSize + 32" : "totalSize"};
}`;
}


export function generateStructToABI(method: IRMethod, contract: IRContract): string | undefined {
  if (method.outputs?.[0]?.type !== AbiType.Struct) {
    return undefined;
  }
  const structName = extractStructName(method.outputs?.[0]?.originalType as string);
  const structInfo = contract.structs?.find((s) => s.name === structName);
  if (!structInfo) {
    return undefined;
  }


  const getDynamicSizeFn = generateGetDynamicSize(structInfo);
  const stringOffsets = structInfo.fields.map((field, index) => {
    if (field.type === AbiType.String) {
      return `
  const value${index} = StructMemory.getString(memoryStruct, ${field.offset});
  const len${index} = StructMemory.getStringLength(memoryStruct, ${field.offset});
  const paddedLen${index} = (len${index} + 31) & ~31;

  const offset${index} = totalSize;
  totalSize += 32 + paddedLen${index};`;
    }
  }).join("");

  const isDynamic = structInfo.dynamic;
  const fieldSetters = structInfo.fields.map((field, index) => {
    if (field.type === AbiType.String) {
      return `  StructABI.setString(structABI + 32, structABI + 32 + ${field.offset}, value${index}, offset${index});`;
    }

    if (isDynamic) {
      return `  StructABI.setField(structABI + 32 + ${field.offset}, memoryStruct + ${field.offset});`;
    }

    return `  StructABI.setField(structABI + ${field.offset}, memoryStruct + ${field.offset});`;
  }).join("\n");

  return `
  ${getDynamicSizeFn}

function ${structName}_toABI(memoryStruct: usize): usize {
  let totalSize = ${structInfo.size};
  ${stringOffsets}

  const structABI = StructABI.alloc(totalSize);
  ${fieldSetters}

  return structABI;
} `;
}