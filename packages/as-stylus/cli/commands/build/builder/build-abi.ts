import fs from "fs";
import path from "path";
import { AnalyzedContract, AbiItem, AbiInput, AbiOutput } from "../../../types/types";

export function buildAbi(targetPath: string, contract: AnalyzedContract) {
  const abi: AbiItem[] = [];

  for (const method of contract.methods) {
    if (method.visibility !== "public" && method.visibility !== "external") continue;

    const inputs: AbiInput[] = method.inputs.map((param, i) => ({
      name: param.name,
      type: convertType(param.type),
    }));

    const outputs: AbiOutput[] = method.outputs.map((param, i) => ({
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

  if(contract.constructor) {
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

  fs.writeFileSync(
    path.join(targetPath, "abi.json"),
    JSON.stringify(abi, null, 2)
  );
}

function convertType(type: string): string {
  switch (type) {
    case "u32":
    case "i32":
      return "uint32";
    case "bool":
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

