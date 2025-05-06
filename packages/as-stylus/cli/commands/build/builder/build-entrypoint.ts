import fs from "fs";
import path from "path";
import { AnalyzedContract, AnalyzedMethod } from "../../../types/types";
import { fileURLToPath } from "url";

export function generateUserEntrypoint(methods: AnalyzedMethod[]) {
  const imports: string[] = [];
  const entries: string[] = [];
  for (const { name, visibility } of methods) {
    if (visibility  === "external" || visibility === "public"){
      const sig = `0x${Buffer.from(name).toString("hex").slice(0, 8)}`;
      imports.push(`import { ${name} } from "./index.transformed";`);
      entries.push(`if (selector == ${sig}) { ${name}(); return 0; }`);
    }
  }

  return {
    imports: imports.join("\n"),
    entrypointBody: entries.join("\n  "),
  };
}

export function buildEntrypoint(userFilePath: string, contract: AnalyzedContract): void {

  const { imports, entrypointBody } = generateUserEntrypoint(contract.methods);
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.resolve(__dirname, "../../../../templates/index.template.ts");

  const contractBasePath = path.dirname(userFilePath);
  const targetPath = path.join(contractBasePath, ".dist");

  let indexTemplate = fs.readFileSync(templatePath, "utf-8");
  indexTemplate = indexTemplate.replace("// @logic_imports", imports);
  indexTemplate = indexTemplate.replace("// @user_entrypoint", entrypointBody);

  fs.writeFileSync(path.join(targetPath, "index.ts"), indexTemplate);
}