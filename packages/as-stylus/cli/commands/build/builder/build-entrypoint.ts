import keccak256 from "keccak256";
import path from "path";

import { IRContract } from "@/cli/types/ir.types.js";
import { writeFile } from "@/cli/utils/fs.js";
import { getUserEntrypointTemplate } from "@/templates/entry-point.js";

import { generateArgsLoadBlock } from "../transformers/utils/args.js";

function getCanonicalType(type: string): string {
  return type;
}

export function generateUserEntrypoint(contract: IRContract) {
  const imports: string[] = [];
  const entries: string[] = [];

  for (const method of contract.methods) {
    const { name, visibility, inputs, stateMutability } = method;

    if (["public", "external"].includes(visibility)) {
      // Create function signature: name(type1,type2,...)
      const paramTypes = inputs.map(input => getCanonicalType(input.type)).join(",");
      const functionSignature = `${name}(${paramTypes})`;
      
      // Generate selector using keccak256 hash of the function signature
      const hash = keccak256(functionSignature).toString('hex');
      const sig = `0x${hash.slice(0, 8)}`; // First 4 bytes (8 hex chars)
      imports.push(`import { ${name} } from "./contract.transformed";`);

      const { argLines, callArgs } = generateArgsLoadBlock(inputs);
      const outputType = method.outputs?.[0]?.type ?? "U256";
      const callLine =
        (["pure", "view"].includes(stateMutability) && (outputType !== "void" && outputType !== "any"))
          ? (() => {
            const size = getReturnSize(outputType);
            return `let ptr = ${name}(${callArgs.join(", ")}); write_result(ptr, ${size}); return 0;`;
          })()
          : `${name}(${callArgs.join(", ")}); return 0;`;

      const indentedBody = [...argLines, callLine].map(line => `    ${line}`).join("\n");
      entries.push(`  if (selector == ${sig}) {\n${indentedBody}\n  }`);
    }
  }

  if (contract.constructor) {
    const { inputs } = contract.constructor;
    const { argLines, callArgs } = generateArgsLoadBlock(inputs);
    console.log(contract.constructor);
    // Create constructor signature: deploy(type1,type2,...)
    const paramTypes = inputs.map(input => getCanonicalType(input.type)).join(",");
    const functionSignature = `deploy(${paramTypes})`;
    
    // Generate selector using keccak256 hash of the function signature
    const hash = keccak256(functionSignature).toString('hex');
    const deploySig = `0x${hash.slice(0, 8)}`; // First 4 bytes (8 hex chars)
    imports.push(`import { deploy } from "./contract.transformed";`);
  
    const callLine = `deploy(${callArgs.join(", ")}); return 0;`;
    const indentedBody = [...argLines, callLine].map(line => `    ${line}`).join("\n");
  
    const deployEntry = `  if (selector == ${deploySig}) {\n${indentedBody}\n  }`;
    entries.push(deployEntry);
  }
  

  return {
    imports: imports.join("\n"),
    entrypointBody: entries.join("\n"),
  };
}

function getReturnSize(type: string): number {
  switch (type) {
    case "U256": return 32;
    case "Address": return 20;
    case "boolean": return 1;
    case "string": return 32;
    default: return 32;
  }
}

export function buildEntrypoint(userFilePath: string, contract: IRContract): void {
  const { imports, entrypointBody } = generateUserEntrypoint(contract);
  const contractBasePath = path.dirname(userFilePath);

  let indexTemplate = getUserEntrypointTemplate();
  indexTemplate = indexTemplate.replace("// @logic_imports", imports);
  indexTemplate = indexTemplate.replace("// @user_entrypoint", entrypointBody);

  writeFile(path.join(contractBasePath, "entrypoint.ts"), indexTemplate);
}
