import { ErrorManager } from "../../../../cli/commands/build/analyzers/shared/error-manager";

export abstract class IRBuilder<TResult> {
  constructor(protected readonly errorManager: ErrorManager) {}

  protected abstract validate(): boolean;

  public validateAndBuildIR(): TResult {
    if (!this.validate()) {
      this.errorManager.throwIfErrors();
    }

    return this.buildIntermediateRepresentation();
  }

  protected abstract buildIntermediateRepresentation(): TResult;
} 