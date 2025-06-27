import path from "path";
import { AbiStateMutability, toFunctionSelector, toFunctionSignature } from 'viem';

import { AbiType } from "@/cli/types/abi.types.js";
import { IRContract, IRMethod } from "@/cli/types/ir.types.js";
import { writeFile } from "@/cli/utils/fs.js";
import { getReturnSize } from "@/cli/utils/type-utils.js";
import { getUserEntrypointTemplate } from "@/templates/entry-point.js";

import { convertType } from "./build-abi.js";
import { generateArgsLoadBlock } from "../transformers/utils/args.js";


function getFunctionSelector(method: IRMethod): string {
  const { name, inputs } = method;

  const signature = toFunctionSignature({
    name,
    type: "function",
    stateMutability: method.stateMutability as AbiStateMutability,
    inputs: inputs.map(input => ({
      name: input.name,
      type: convertType(input.type),
    })),
    outputs: method.outputs.map(output => ({
      name: output.name,
      type: convertType(output.type),
    })),
  });

  return toFunctionSelector(signature);
}

export function generateUserEntrypoint(contract: IRContract) {
  const imports: string[] = [];
  const entries: string[] = [];

  for (const method of contract.methods) {
    const { name, visibility, inputs, stateMutability } = method;

    if (["public", "external"].includes(visibility)) {
      // Create function signature: name(type1,type2,...)
      const sig = getFunctionSelector(method);
      imports.push(`import { ${name} } from "./contract.transformed";`);

      const { argLines, callArgs } = generateArgsLoadBlock(inputs);
      const outputType = method.outputs?.[0]?.type ?? "U256";
      let callLine = "";
      if (["pure", "view"].includes(stateMutability) && (outputType !== AbiType.Void && outputType !== AbiType.Any)) {
        if (outputType === AbiType.String) {
          callLine = [
            `const buf = ${name}(${callArgs.map(arg => arg.name).join(", ")});`,
            `const len = loadU32BE(buf + 0x20 + 28);`,
            `const padded = ((len + 31) & ~31);`,
            `write_result(buf, 0x40 + padded);`,
            `return 0;`
          ].join("\n    ");
        } else {
          const size = getReturnSize(outputType);
          callLine = `let ptr = ${name}(${callArgs.map(arg => arg.name).join(", ")}); write_result(ptr, ${size}); return 0;`;
        }
      } else {
        callLine = `${name}(${callArgs.map(arg => arg.name).join(", ")}); return 0;`;
      }

      const indentedBody = [...argLines, callLine].map(line => `    ${line}`).join("\n");
      entries.push(`  if (selector == ${sig}) {\n${indentedBody}\n  }`);
    }
  }

  if (contract.constructor) {
    const { inputs } = contract.constructor;
    const { argLines, callArgs } = generateArgsLoadBlock(inputs);
    const deploySig = getFunctionSelector({
      name: "deploy",
      visibility: "public",
      stateMutability: "nonpayable",
      inputs: inputs.map(input => ({
        name: input.name,
        type: convertType(input.type),
      })),
      outputs: [],
      ir: [],
    });
    
    imports.push(`import { deploy } from "./contract.transformed";`);
    imports.push(`import { toBool } from "as-stylus/core/types/boolean";`);
  
    const callLine = `deploy(${callArgs.map(arg => arg.name).join(", ")}); return 0;`;
    const indentedBody = [...argLines, callLine].map(line => `    ${line}`).filter(line => line.trim() !== "").join("\n");
  
    const deployEntry = `  if (selector == ${deploySig}) {\n${indentedBody}\n  }`;
    entries.push(deployEntry);
  }
  

  return {
    imports: imports.join("\n"),
    entrypointBody: entries.join("\n"),
  };
}

export function buildEntrypoint(userFilePath: string, contract: IRContract): void {
  const { imports, entrypointBody } = generateUserEntrypoint(contract);
  const contractBasePath = path.dirname(userFilePath);

  let indexTemplate = getUserEntrypointTemplate();
  indexTemplate = indexTemplate.replace("// @logic_imports", imports);
  indexTemplate = indexTemplate.replace("// @user_entrypoint", entrypointBody);

  writeFile(path.join(contractBasePath, "entrypoint.ts"), indexTemplate);
}
