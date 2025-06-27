import path from "path";

import { AbiItem, AbiInput, AbiOutput } from "@/cli/types/abi.types.js";
import { IRContract } from "@/cli/types/ir.types.js";
import { ABI_PATH } from "@/cli/utils/constants.js";
import { writeFile } from "@/cli/utils/fs.js";

export function buildAbi(targetPath: string, contract: IRContract) {
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

    const stateMutability: AbiItem["stateMutability"] =
      method.outputs.length > 0 ? "view" : "nonpayable";

    abi.push({
      name: method.name,
      type: "function",
      stateMutability,
      inputs,
      outputs,
    });
  }

  if (contract.constructor) {
    abi.push({
      type: "constructor",
      stateMutability: "nonpayable",
      inputs: contract.constructor.inputs.map((param) => ({
        name: param.name,
        type: convertType(param.type),
      })),
      outputs: [],
    });
  }

  const abiPath = path.join(targetPath, ABI_PATH, `${contract.name}-abi.json`);
  writeFile(abiPath, JSON.stringify(abi, null, 2));
}

export function convertType(type: string): string {
  switch (type.toLowerCase()) {
    case "u256":
      return "uint256";
    case "i256":
      return "int256";
    case "bool":
    case "boolean":
      return "bool";
    case "string":
      return "string";
    case "address":
      return "address";
    case "bytes32":
      return "bytes32";
    default:
      return "uint256";
  }
}
