import { ErrorManager } from "./error-manager.js";

export abstract class BaseValidator {
  constructor(protected readonly errorManager: ErrorManager) {}

  abstract validate(): boolean;
}
