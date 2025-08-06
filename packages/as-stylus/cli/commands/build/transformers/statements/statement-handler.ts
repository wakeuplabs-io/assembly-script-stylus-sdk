import { IRStatement } from "@/cli/types/ir.types.js";

import { StatementHandler as BaseStatementHandler } from "./base-statement-handler.js";
import { ContractContext } from "../core/contract-context.js";
import { AssignmentHandler } from "./handlers/assignment-handler.js";
import { BlockHandler } from "./handlers/block-handler.js";
import { DoWhileHandler } from "./handlers/do-while-handler.js";
import { ExpressionStatementHandler } from "./handlers/expression-statement-handler.js";
import { ForHandler } from "./handlers/for-handler.js";
import { IfHandler } from "./handlers/if-handler.js";
import { ReturnHandler } from "./handlers/return-handler.js";
import { RevertHandler } from "./handlers/revert-handler.js";
import { VariableDeclarationHandler } from "./handlers/variable-declaration-handler.js";
import { WhileHandler } from "./handlers/while-handler.js";

export type StatementKind = 
  | "assign" 
  | "let" 
  | "const" 
  | "expr" 
  | "return" 
  | "if" 
  | "for" 
  | "while" 
  | "do_while" 
  | "block" 
  | "revert";

/**
 * Main statement handler that delegates to specific statement handlers
 * Uses the Chain of Responsibility pattern
 */
export class StatementHandler {
  private handlers: BaseStatementHandler[];

  constructor(private contractContext: ContractContext) {
    this.handlers = this.createHandlers();
  }

  /**
   * Creates and returns all statement handlers
   */
  private createHandlers(): BaseStatementHandler[] {
    return [
      new AssignmentHandler(this.contractContext),
      new VariableDeclarationHandler(this.contractContext),
      new ExpressionStatementHandler(this.contractContext),
      new ReturnHandler(this.contractContext),
      new IfHandler(this.contractContext),
      new ForHandler(this.contractContext),
      new WhileHandler(this.contractContext),
      new DoWhileHandler(this.contractContext),
      new BlockHandler(this.contractContext),
      new RevertHandler(this.contractContext),
    ];
  }

  /**
   * Handles a single statement by finding the appropriate handler
   * @param stmt The statement to handle
   * @param indent The indentation string
   * @returns The generated code
   */
  handle(stmt: IRStatement, indent: string = "  "): string {
    // Try each handler in order
    for (const handler of this.handlers) {
      if (handler.canHandle(stmt)) {
        return handler.handle(stmt, indent);
      }
    }

    // Fallback for unsupported statements
    return `${indent}/* Unsupported statement: ${(stmt as { kind: string }).kind} */`;
  }

  /**
   * Handles multiple statements
   * @param statements Array of statements to handle
   * @returns The generated code
   */
  handleStatements(statements: IRStatement[]): string {
    return statements
      .map((s) => this.handle(s, "  "))
      .filter((s) => s) // Filter empty statements
      .join("\n");
  }
}