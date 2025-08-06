import { IRStatement } from "@/cli/types/ir.types.js";

import { ContractContext } from "../core/contract-context.js";

/**
 * Abstract base class for statement handlers
 * Each statement handler implements a strategy for handling a specific type of statement
 */
export abstract class StatementHandler {
  constructor(protected contractContext: ContractContext) {}

  /**
   * Determines if this handler can process the given statement
   */
  abstract canHandle(stmt: IRStatement): boolean;

  /**
   * Processes the statement and returns the generated code
   * @param stmt The statement to process
   * @param indent The indentation string to use
   * @returns The generated code string
   */
  abstract handle(stmt: IRStatement, indent: string): string;
}