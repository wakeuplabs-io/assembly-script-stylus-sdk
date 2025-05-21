import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { IRMethod, IRContract } from "@/cli/types/ir.types.js";

export function generateUserEntrypoint(contract: IRContract) {
  const imports: string[] = [];
  const entries: string[] = [];

  for (const { name, visibility, stateMutability } of contract.methods) {
    if (visibility === "external" || visibility === "public") {
      const hex = Buffer.from(name).toString("hex").slice(0, 8).padEnd(8, "0");
      const sig = `0x${hex}`;
      imports.push(`import { ${name} } from "./contract.transformed";`);

      if (stateMutability === "view" || stateMutability === "pure") {
        entries.push(
          `if (selector == ${sig}) { let ptr = ${name}(); write_result(ptr, 32); return 0; }`,
        );
      } else {
        entries.push(`if (selector == ${sig}) { ${name}(); return 0; }`);
      }
    }
  }

  if (contract.constructor) {
    const deployHex = Buffer.from("deploy").toString("hex").slice(0, 8).padEnd(8, "0");
    const deploySig = `0x${deployHex}`;
    imports.push('import { deploy } from "./contract.transformed";');
    entries.push(`if (selector == ${deploySig}) { deploy(); return 0; }`);
  }

  return {
    imports: imports.join("\n"),
    entrypointBody: entries.join("\n  "),
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
