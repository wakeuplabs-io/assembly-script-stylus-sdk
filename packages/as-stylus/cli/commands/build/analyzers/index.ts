// cli/transformers/index.ts
import path from "path";
import { Project } from "ts-morph";

import { IRContract } from "@/cli/types/ir.types.js";

import { exportContractToJSON, generateContractTree } from "./tree-builder.js";
import { ErrorManager } from "./shared/error-manager.js";
import { ContractIRBuilder } from "./contract/ir-builder.js";

export function applyAnalysis(transformedFile: string, errorManager: ErrorManager): IRContract {
  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
  });

  const sourceFile = project.addSourceFileAtPath(transformedFile);

  const analyzer = new ContractIRBuilder(sourceFile, errorManager);
  const result = analyzer.validateAndBuildIR();

  exportContractToJSON(result);
  generateContractTree(result);

  return result;
}
