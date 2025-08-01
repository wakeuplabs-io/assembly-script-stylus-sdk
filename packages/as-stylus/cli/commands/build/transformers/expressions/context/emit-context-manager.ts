import { EmitContext } from "../../../../../types/emit.types.js";

/**
 * Simple utility functions for managing emit context.
 * Provides helper functions to create and manage context without global state.
 */

/**
 * Create a new emit context with default values
 * @param contractName - The contract name
 * @param parentName - The parent contract name (for inheritance)
 * @returns A new EmitContext object
 */
export function createEmitContext(
  contractName: string = "",
  parentName: string = ""
): EmitContext {
  return {
    isInStatement: false,
    contractName,
    parentName,
    strCounter: 0,
    ptrCounter: 0,
  };
}

/**
 * Update the isInStatement flag in a context
 * @param context - The context to update
 * @param isInStatement - Whether we're in a statement
 * @returns Updated context
 */
export function updateIsInStatement(
  context: EmitContext,
  isInStatement: boolean
): EmitContext {
  return {
    ...context,
    isInStatement
  };
}

/**
 * Increment the string counter in a context
 * @param context - The context to update
 * @returns Updated context with incremented counter
 */
export function incrementStrCounter(context: EmitContext): EmitContext {
  return {
    ...context,
    strCounter: context.strCounter + 1
  };
}

/**
 * Increment the pointer counter in a context
 * @param context - The context to update
 * @returns Updated context with incremented counter
 */
export function incrementPtrCounter(context: EmitContext): EmitContext {
  return {
    ...context,
    ptrCounter: context.ptrCounter + 1
  };
}