import { ErrorTemplate, createErrorMessage } from "@/cli/utils/error-messages.js";

import { ValidationError } from "./validation-error.js";
import SEMANTIC_ERRORS from "../../errors/semantic-list.js";
import SYNTACTIC_ERRORS from "../../errors/syntactic-list.js";

export enum DeploymentErrorCategory {
  VALIDATION = "validation",
  NETWORK = "network", 
  CONTRACT = "contract",
  CONFIGURATION = "configuration",
  SYSTEM = "system"
}

export interface DeploymentError {
  category: DeploymentErrorCategory;
  template: ErrorTemplate;
  originalError?: string;
}

export class ErrorManager {
  private semanticErrors: ValidationError[] = [];
  private syntaxErrors: ValidationError[] = [];
  private deploymentErrors: DeploymentError[] = [];

  addSemanticError(code: string, location?: string, line?: number, args?: string[]): void {
    // TODO: remove this once we have a proper error message
    const message = SEMANTIC_ERRORS[code]?.message(args ?? []) ?? code;
    this.semanticErrors.push(new ValidationError(message, code, "semantic", location, line));
  }

  addSyntaxError(code: string, location?: string, line?: number, args?: string[]): void {
    // TODO: remove this once we have a proper error message
    const message = SYNTACTIC_ERRORS[code]?.message(args ?? []) ?? code;
    this.syntaxErrors.push(new ValidationError(message, code, "syntax", location, line));
  }

  addDeploymentError(category: DeploymentErrorCategory, template: ErrorTemplate, originalError?: string): void {
    this.deploymentErrors.push({
      category,
      template,
      originalError
    });
  }

  addValidationError(template: ErrorTemplate): void {
    this.addDeploymentError(DeploymentErrorCategory.VALIDATION, template);
  }

  addNetworkError(template: ErrorTemplate, originalError?: string): void {
    this.addDeploymentError(DeploymentErrorCategory.NETWORK, template, originalError);
  }

  addContractError(template: ErrorTemplate, originalError?: string): void {
    this.addDeploymentError(DeploymentErrorCategory.CONTRACT, template, originalError);
  }

  hasErrors(): boolean {
    return this.semanticErrors.length > 0 || this.syntaxErrors.length > 0 || this.deploymentErrors.length > 0;
  }

  hasDeploymentErrors(): boolean {
    return this.deploymentErrors.length > 0;
  }

  getSemanticErrors(): ValidationError[] {
    return this.semanticErrors;
  }

  getSyntaxErrors(): ValidationError[] {
    return this.syntaxErrors;
  }

  getErrors(): ValidationError[] {
    return [...this.semanticErrors, ...this.syntaxErrors];
  }

  getDeploymentErrors(category?: DeploymentErrorCategory): DeploymentError[] {
    if (category) {
      return this.deploymentErrors.filter(error => error.category === category);
    }
    return this.deploymentErrors;
  }

  getDeploymentErrorMessages(): string[] {
    return this.deploymentErrors.map(error => createErrorMessage(error.template));
  }

  throwIfErrors(): void {
    if (this.hasErrors()) {
      const errorMessages = this.getErrors()
        .map((error) => {
          let locationInfo = error.location ? ` at ${error.location}` : "";
          locationInfo += error.line ? `:${error.line}` : "";
          return `[${error.level}] ${error.message}${locationInfo}`;
        })
        .join("\n");
      throw new Error(errorMessages);
    }
  }

  throwIfDeploymentErrors(): void {
    if (this.hasDeploymentErrors()) {
      const actionableMessages = this.getDeploymentErrorMessages();
      throw new Error(actionableMessages.join("\n\n"));
    }
  }

  clearDeploymentErrors(): void {
    this.deploymentErrors = [];
  }

  getErrorSummary(): { [key: string]: number } {
    const summary: { [key: string]: number } = {
      semantic: this.semanticErrors.length,
      syntax: this.syntaxErrors.length,
      deployment: this.deploymentErrors.length
    };
    
    for (const category of Object.values(DeploymentErrorCategory)) {
      const categoryErrors = this.getDeploymentErrors(category);
      summary[`deployment_${category}`] = categoryErrors.length;
    }
    
    return summary;
  }
}
