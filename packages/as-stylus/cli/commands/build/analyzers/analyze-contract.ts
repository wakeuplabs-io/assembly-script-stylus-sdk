import { SourceFile } from "ts-morph";
import { IRContract } from "../../../types/ir.types.js";
import { ContractAnalyzer } from "./visitors/contract-visitor.js";
import { ErrorManager } from "./errors/error-manager.js";

export function analyzeContract(sourceFile: SourceFile): IRContract {
  const errorManager = new ErrorManager();
  const analyzer = new ContractAnalyzer(sourceFile, errorManager);
  
  const result = analyzer.visitSourceFile();

  if (errorManager.hasErrors()) {
    errorManager.getErrors().forEach(error => error.log());
  }

  return result;
}



