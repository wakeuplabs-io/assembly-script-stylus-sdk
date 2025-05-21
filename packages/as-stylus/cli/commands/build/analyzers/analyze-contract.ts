import { SourceFile } from "ts-morph";
import { IRContract } from "../../../types/ir.types.js";
import { ErrorManager } from "./shared/error-manager.js";
import { ContractIRBuilder } from "./contract/ir-builder.js";

export function analyzeContract(sourceFile: SourceFile): IRContract {
  const errorManager = new ErrorManager();
  const analyzer = new ContractIRBuilder(sourceFile, errorManager);
  
  const result = analyzer.build();

  if (errorManager.hasErrors()) {
    errorManager.getErrors().forEach(error => error.log());
  }

  return result;
}



