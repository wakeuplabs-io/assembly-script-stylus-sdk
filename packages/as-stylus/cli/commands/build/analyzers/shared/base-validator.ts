import { ErrorManager } from "./error-manager";

export abstract class BaseValidator {
  constructor(
    protected readonly errorManager: ErrorManager
  ) {}

  abstract validate(): boolean;
}
