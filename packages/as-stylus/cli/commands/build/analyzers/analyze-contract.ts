import { SourceFile } from "ts-morph";
import { IRContract } from "../../../types/ir.types.js";
import { ContractAnalyzer } from "./visitors/contract-visitor.js";

export function analyzeContract(sourceFile: SourceFile): IRContract {
  const analyzer = new ContractAnalyzer(sourceFile);
  return analyzer.visitSourceFile();
}



