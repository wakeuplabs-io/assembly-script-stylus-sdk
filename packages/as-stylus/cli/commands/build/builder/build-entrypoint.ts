import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateArgsLoadBlock } from "../transformers/utils/args.js";
import { IRContract } from "@/cli/types/ir.types.js";

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
          ? `let ptr = ${name}(${callArgs.join(", ")}); write_result(ptr, 32); return 0;`
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

export function buildEntrypoint(userFilePath: string, contract: IRContract): void {
  const { imports, entrypointBody } = generateUserEntrypoint(contract);
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.resolve(__dirname, "../../../../templates/index.template.ts");
  const contractBasePath = path.dirname(userFilePath);
  const targetPath = path.join(contractBasePath, ".dist");

  let indexTemplate = fs.readFileSync(templatePath, "utf-8");
  indexTemplate = indexTemplate.replace("// @logic_imports", imports);
  indexTemplate = indexTemplate.replace("// @user_entrypoint", entrypointBody);

  fs.writeFileSync(path.join(targetPath, "entrypoint.ts"), indexTemplate);
}
