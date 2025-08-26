import { ErrorTemplate, createErrorMessage } from "@/cli/utils/error-messages.js";

import { ValidationError } from "./validation-error.js";
import { ErrorCode, createAStylusError } from "@/cli/utils/global-error-handler.js";
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
    // Legacy error handling - map old string codes to new numeric codes
    const message = SEMANTIC_ERRORS[code]?.message(args ?? []) ?? code;
    const numericCode = this.mapSemanticCodeToNumeric(code);
    this.semanticErrors.push(new ValidationError(message, code, "semantic", location, line, numericCode));
  }

  addSyntaxError(code: string, location?: string, line?: number, args?: string[]): void {
    // Legacy error handling - map old string codes to new numeric codes  
    const message = SYNTACTIC_ERRORS[code]?.message(args ?? []) ?? code;
    const numericCode = this.mapSyntaxCodeToNumeric(code);
    this.syntaxErrors.push(new ValidationError(message, code, "syntax", location, line, numericCode));
  }

  /**
   * Add semantic error with new unified error code system
   */
  addSemanticErrorWithCode(code: ErrorCode, location?: string, line?: number, message?: string): void {
    const errorMessage = message || `Semantic error: ${ErrorCode[code]}`;
    this.semanticErrors.push(new ValidationError(errorMessage, ErrorCode[code], "semantic", location, line, code));
  }

  /**
   * Add syntax error with new unified error code system
   */
  addSyntaxErrorWithCode(code: ErrorCode, location?: string, line?: number, message?: string): void {
    const errorMessage = message || `Syntax error: ${ErrorCode[code]}`;
    this.syntaxErrors.push(new ValidationError(errorMessage, ErrorCode[code], "syntax", location, line, code));
  }

  /**
   * Map legacy semantic error codes to new numeric codes
   */
  private mapSemanticCodeToNumeric(code: string): ErrorCode {
    const semanticMappings: Record<string, ErrorCode> = {
      'SEMANTIC_ERROR': ErrorCode.SEMANTIC_ERROR,
      'TYPE_MISMATCH': ErrorCode.TYPE_MISMATCH,
      'UNDEFINED_VARIABLE': ErrorCode.UNDEFINED_VARIABLE,
      'UNDEFINED_FUNCTION': ErrorCode.UNDEFINED_FUNCTION,
      'INVALID_ASSIGNMENT': ErrorCode.INVALID_ASSIGNMENT,
      'SCOPE_ERROR': ErrorCode.SCOPE_ERROR,
      'INHERITANCE_ERROR': ErrorCode.INHERITANCE_ERROR,
      'INTERFACE_ERROR': ErrorCode.INTERFACE_ERROR,
      'GENERIC_ERROR': ErrorCode.GENERIC_ERROR,
      'CONTRACT_VALIDATION_ERROR': ErrorCode.CONTRACT_VALIDATION_ERROR,
    };
    
    return semanticMappings[code] || ErrorCode.SEMANTIC_ERROR;
  }

  /**
   * Map legacy syntax error codes to new numeric codes
   */
  private mapSyntaxCodeToNumeric(code: string): ErrorCode {
    const syntaxMappings: Record<string, ErrorCode> = {
      'SYNTAX_ERROR': ErrorCode.SYNTAX_ERROR,
      'INVALID_SYNTAX': ErrorCode.INVALID_SYNTAX,
      'MISSING_SEMICOLON': ErrorCode.MISSING_SEMICOLON,
      'INVALID_TOKEN': ErrorCode.INVALID_TOKEN,
      'UNEXPECTED_TOKEN': ErrorCode.UNEXPECTED_TOKEN,
      'MISSING_BRACKET': ErrorCode.MISSING_BRACKET,
      'INVALID_EXPRESSION': ErrorCode.INVALID_EXPRESSION,
      'MISSING_DECLARATION': ErrorCode.MISSING_DECLARATION,
      'INVALID_STATEMENT': ErrorCode.INVALID_STATEMENT,
      'PARSE_ERROR': ErrorCode.PARSE_ERROR,
    };
    
    return syntaxMappings[code] || ErrorCode.SYNTAX_ERROR;
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
          const codeInfo = error.numericCode ? `[${error.numericCode}]` : `[${error.level}]`;
          return `${codeInfo} ${error.message}${locationInfo}`;
        })
        .join("\n");
      
      // Create unified error for compilation failures
      const compilationError = createAStylusError(
        this.syntaxErrors.length > 0 ? ErrorCode.SYNTAX_ERROR : ErrorCode.SEMANTIC_ERROR,
        errorMessages
      );
      throw compilationError;
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
