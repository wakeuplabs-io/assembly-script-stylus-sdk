import { Project } from "ts-morph";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const USER_CONTRACT_PATH = "../../contracts/test-1/index.ts";

function generateUserEntrypoint(userFilePath: string): { imports: string; entrypointBody: string } {
  const project = new Project();
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

export function generateEntrypoint() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const userFilePath = path.resolve(__dirname, USER_CONTRACT_PATH);
  const contractBasePath = path.dirname(userFilePath);
  const targetPath = path.join(contractBasePath, ".dist");

  const { imports, entrypointBody } = generateUserEntrypoint(userFilePath);

  let indexTemplate = fs.readFileSync(
    path.resolve(__dirname, "../../templates/index.template.ts"),
    "utf-8",
  );

  indexTemplate = indexTemplate.replace("// @logic_imports", imports);
  indexTemplate = indexTemplate.replace("// @user_entrypoint", entrypointBody);

  fs.writeFileSync(path.join(targetPath, "index.ts"), indexTemplate);

}
