import { ErrorManager } from "./error-manager.js";

export abstract class IRBuilder<TResult> {
  constructor(protected readonly errorManager: ErrorManager) {}

  protected abstract validate(): boolean;

  public validateAndBuildIR(): TResult {
    if (!this.validate()) {
      //TODO: do action on errors
    }

    return this.buildIR();
  }

  protected abstract buildIR(): TResult;
}
