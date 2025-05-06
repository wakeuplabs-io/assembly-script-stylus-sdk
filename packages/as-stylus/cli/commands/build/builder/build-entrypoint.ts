import { Project } from "ts-morph";
import fs from "fs";
import path from "path";
import { analyzeContract, AnalyzedMethod } from "../validators/analyze-contract";

export function generateUserEntrypoint(analyzed: AnalyzedMethod[]) {
  const imports: string[] = [];
  const entries: string[] = [];

  for (const { name, visibility } of analyzed) {
    if (visibility !== "external") continue;

    const sig = `0x${Buffer.from(name).toString("hex").slice(0, 8)}`;
    imports.push(`import { ${name} } from "./index.transformed";`);
    entries.push(`if (selector == ${sig}) { ${name}(); return 0; }`);
  }

  return {
    imports: imports.join("\n"),
    entrypointBody: entries.join("\n  "),
  };
}

export function generateEntrypoint(userFilePath: string): void {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(userFilePath);

  const analyzed = analyzeContract(sourceFile);
  const { imports, entrypointBody } = generateUserEntrypoint(analyzed);

  const contractBasePath = path.dirname(userFilePath);
  const targetPath = path.join(contractBasePath, ".dist");
  const templatePath = path.resolve(__dirname, "../../templates/index.template.ts");

  let indexTemplate = fs.readFileSync(templatePath, "utf-8");
  indexTemplate = indexTemplate.replace("// @logic_imports", imports);
  indexTemplate = indexTemplate.replace("// @user_entrypoint", entrypointBody);

  fs.writeFileSync(path.join(targetPath, "index.ts"), indexTemplate);
}