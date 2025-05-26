import { SourceFile } from "ts-morph";

import { ContractIRBuilder } from "./contract/ir-builder.js";
import { ErrorManager } from "./shared/error-manager.js";
import { IRContract } from "@/cli/types/ir.types.js";

export function analyzeContract(sourceFile: SourceFile): IRContract {
  const errorManager = new ErrorManager();
  const analyzer = new ContractIRBuilder(sourceFile, errorManager);

  const result = analyzer.validateAndBuildIR();

  if (errorManager.hasErrors()) {
    errorManager.getErrors().forEach((error) => error.log());
  }

  return result;
}
