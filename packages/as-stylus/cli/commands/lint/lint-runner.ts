import { IRContract } from "@/cli/types/ir.types.js";

import { Logger } from "../../services/logger.js";
import { ProjectFinder } from "../../services/project-finder.js";
import { applyAnalysis } from "../build/analyzers/index.js";
import { ErrorManager } from "../build/analyzers/shared/error-manager.js";

export class LintRunner {
  private errorManager: ErrorManager;
  private projectFinder: ProjectFinder;
  private logger: Logger;

  constructor(contractsRoot: string, errorManager: ErrorManager) {
    this.errorManager = errorManager;
    this.projectFinder = new ProjectFinder(contractsRoot, errorManager);
    this.logger = Logger.getInstance();
  }

  validate(): boolean {
    return this.projectFinder.validateProjects();
  }

  lint(): void {
    const projectPath = this.projectFinder.getCurrentProject();
    const contracts = this.projectFinder.getAllContractPaths(projectPath);

    contracts.forEach((contractPath) => {
      this.logger.info(`Linting: ${contractPath}`);

      const contract: IRContract = applyAnalysis(contractPath);
      this.validateContract(contract, contractPath);
    });

    this.logger.logErrorList(this.errorManager.getErrors());
  }

  // TODO: check if this is needed. Anyway it is not the correct place for this.
  private validateContract(contract: IRContract, contractPath: string): void {
    // Validate contract name
    if (!contract.name) {
      this.errorManager.addSemanticError("Contract must have a name", contractPath);
    }

    // Validate methods
    contract.methods.forEach((method) => {
      // Validate method visibility
      if (!method.visibility) {
        this.errorManager.addSemanticError(
          `Method ${method.name} must have a visibility modifier`,
          contractPath,
        );
      }

      // Validate method inputs
      method.inputs.forEach((input) => {
        if (!input.name) {
          this.errorManager.addSemanticError(
            `Method ${method.name} has an unnamed input parameter`,
            contractPath,
          );
        }
        if (!input.type) {
          this.errorManager.addSemanticError(
            `Method ${method.name} has an input parameter without type`,
            contractPath,
          );
        }
      });

      // Validate method outputs
      method.outputs.forEach((output) => {
        if (!output.type) {
          this.errorManager.addSemanticError(
            `Method ${method.name} has an output parameter without type`,
            contractPath,
          );
        }
      });
    });
  }
}
