import { AnalysisContext } from "./analysis-context.js";

/**
 * AnalysisContextFactory manages the creation and retrieval of analysis contexts.
 * It ensures that each contract has its own isolated analysis context.
 */
export class AnalysisContextFactory {
  private static contexts: Map<string, AnalysisContext> = new Map();

  /**
   * Gets or creates an analysis context for the specified contract.
   * @param contractId The id of the contract
   * @returns The analysis context for the contract
   */
  static getContext(contractId: string): AnalysisContext {
    if (!this.contexts.has(contractId)) {
      this.contexts.set(contractId, new AnalysisContext());
    }
    return this.contexts.get(contractId)!;
  }

  /**
   * Clears all analysis contexts.
   * Useful for testing or when starting a new analysis session.
   */
  static reset(): void {
    this.contexts.clear();
  }

  /**
   * Checks if a context exists for the given contract.
   * @param contractName The name of the contract
   * @returns true if a context exists, false otherwise
   */
  static hasContext(contractName: string): boolean {
    return this.contexts.has(contractName);
  }
}
