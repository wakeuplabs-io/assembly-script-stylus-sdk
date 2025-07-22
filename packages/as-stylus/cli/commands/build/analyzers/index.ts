// cli/transformers/index.ts
import path from "path";
import { Project } from "ts-morph";

import { IRContract } from "@/cli/types/ir.types.js";

import { ContractIRBuilder } from "./contract/ir-builder.js";
import { exportContractToJSON, exportSymbolTable, generateContractTree } from "./tree-builder.js";

export function applyAnalysis(contractName: string, transformedFile: string): IRContract {
  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
  });

  const sourceFile = project.addSourceFileAtPath(transformedFile);

  const analyzer = new ContractIRBuilder(sourceFile, contractName);
  const result = analyzer.validateAndBuildIR();  

  exportContractToJSON(result);
  generateContractTree(result);
  exportSymbolTable(analyzer.symbolTable);

  return result;
}
