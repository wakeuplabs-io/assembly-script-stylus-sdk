import path from "path";

import { AbiItem, AbiInput, AbiOutput, AbiType, Visibility } from "@/cli/types/abi.types.js";
import { IRContract } from "@/cli/types/ir.types.js";
import { ABI_PATH } from "@/cli/utils/constants.js";
import { writeFile } from "@/cli/utils/fs.js";

import { extractStructName } from "../analyzers/struct/struct-utils.js";
import { generateErrorABI } from "../transformers/error/error-transformer.js";

const createAbiRepresentation = (contract: IRContract, isParent: boolean = false): AbiItem[] => {
  const abi: AbiItem[] = [];

  for (const method of contract.methods) {
    if (method.visibility !== "public" && method.visibility !== "external") continue;

    const inputs: AbiInput[] = method.inputs.map((param) => ({
      name: param.name,
      type: convertType(param.type),
    }));

    const outputs: AbiOutput[] = method.outputs.map((param) => ({
      name: param.name || undefined,
      type: convertType(param.type),
    }));

    abi.push({
      name: method.name,
      type: "function",
      stateMutability: method.stateMutability,
      inputs,
      outputs,
    });
  }

  if (contract.constructor && !isParent) {
     // TODO: rethink this
    abi.push({
      // type: "constructor",
      type: "function",
      name: "deploy",
      stateMutability: Visibility.NONPAYABLE,
      inputs: contract.constructor.inputs.map((param) => ({
        name: param.name,
        type: convertType(param.type),
      })),
      outputs: [],
    });
  }

  // Add custom errors to ABI
  const errorABI = generateErrorABI(contract);
  abi.push(...errorABI);

  return abi;
};

export function buildAbi(targetPath: string, contract: IRContract, allContracts: IRContract[]) {
  const abi: AbiItem[] = [];

  const abiRepresentation = createAbiRepresentation(contract);
  abi.push(...abiRepresentation);

  for (const parent of contract.parents) {
    const parentContract = allContracts.find((c) => c.name === parent);
    if (parentContract) {
      const parentAbi = createAbiRepresentation(parentContract, true);
      abi.push(...parentAbi);
    }
  }

  const abiPath = path.join(targetPath, ABI_PATH, `${contract.name}-abi.json`);
  writeFile(abiPath, JSON.stringify(abi, null, 2));
}

export function convertType(type: string): AbiType {
  if (Object.values(AbiType).includes(type as AbiType)) {
    return type as AbiType;
  }

  switch (type.toLowerCase()) {
    case "u256":
      return AbiType.Uint256;
    case "i256":
      return AbiType.Int256;
    case "bool":
    case "boolean":
      return AbiType.Bool;
    case "str":
    case "string":
      return AbiType.String;
    case "address":
      return AbiType.Address;
    case "bytes32":
      return AbiType.Bytes32;
    default:
      // TODO: Implement this better for structs
      return extractStructName(type) as AbiType;
  }
}
