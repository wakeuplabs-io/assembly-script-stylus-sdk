import path from "path";

import { IRContract } from "@/cli/types/ir.types.js";
import { writeFile } from "@/cli/utils/fs.js";
import { getUserEntrypointTemplate } from "@/templates/entry-point.js";

import { generateArgsLoadBlock } from "../transformers/utils/args.js";

export function generateUserEntrypoint(contract: IRContract) {
  const imports: string[] = [];
  const entries: string[] = [];

  for (const method of contract.methods) {
    const { name, visibility, stateMutability, inputs } = method;

    if (visibility === "external" || visibility === "public") {
      const hex = Buffer.from(name).toString("hex").slice(0, 8).padEnd(8, "0");
      const sig = `0x${hex}`;
      imports.push(`import { ${name} } from "./contract.transformed";`);

      const { argLines, callArgs } = generateArgsLoadBlock(inputs);

      const callLine =
        (stateMutability === "view" || stateMutability === "pure")
          ? (() => {
            const outputType = method.outputs?.[0]?.type ?? "U256";
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
  
    const deployHex = Buffer.from("deploy").toString("hex").slice(0, 8).padEnd(8, "0");
    const deploySig = `0x${deployHex}`;
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
