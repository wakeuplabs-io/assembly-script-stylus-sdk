import { ErrorManager } from "./error-manager";

export abstract class IRBuilder<TResult> {
  constructor(protected readonly errorManager: ErrorManager) {
  }

  protected abstract validate(): boolean;

  protected abstract build(): TResult;
}
