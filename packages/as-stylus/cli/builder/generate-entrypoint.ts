import { Project } from "ts-morph";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const USER_CONTRACT_PATH = "../../contracts/test-1/index.ts";

function generateUserEntrypoint(userFilePath: string): { imports: string; entrypointBody: string } {
  const project = new Project();
  console.log(userFilePath);
  const sourceFile = project.addSourceFileAtPath(userFilePath);

  const functions = sourceFile.getFunctions();
  const entries: string[] = [];
  const imports: string[] = [];

  functions.forEach((fn) => {
    const name = fn.getName();
    if (!name) return;
    const funcSig = `0x${Buffer.from(name).toString("hex").slice(0, 8)}`;
    imports.push(`import { ${name} } from "./index.transformed";`);
    entries.push(`if (selector == ${funcSig}) { ${name}(); return 0; }`);
  });

  return {
    imports: imports.join("\n"),
    entrypointBody: entries.join("\n  "),
  };
}

export function generateEntrypoint(targetPath: string): void {
  const projectRoot = process.cwd(); // base del package ejecutado
  const indexFilePath = path.join(targetPath, "index.transformed.ts")
  const { imports, entrypointBody } = generateUserEntrypoint(indexFilePath);

  const indexTemplatePath = path.join(projectRoot, "templates", "index.template.ts");

  if (!fs.existsSync(indexTemplatePath)) {
    console.error(`[as-stylus] Error: index.template.ts not found at ${indexTemplatePath}`);
    process.exit(1);
  }

  let indexTemplate = fs.readFileSync(indexTemplatePath, "utf-8");

  indexTemplate = indexTemplate.replace("// @logic_imports", imports);
  indexTemplate = indexTemplate.replace("// @user_entrypoint", entrypointBody);

  fs.writeFileSync(path.join(targetPath, "index.ts"), indexTemplate);
}
