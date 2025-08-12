/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Decorators for AssemblyScript Stylus SDK
 * These are empty functions that serve as placeholders when using the package as a dependency.
 * The actual decorators are processed at compile time by the CLI.
 */

/**
 * Marks a class as a smart contract
 * @param _target - The target class
 */
export function Contract(_target: any): any {}

/**
 * Marks a class as an event
 * This creates a proper TypeScript mixin that extends BaseEvent at compile time
 */
export function Event(_target: any): typeof _target & { emit: (...args: any[]) => void } {
  return _target;
}

/**
 * Marks a method as external (callable from outside the contract)
 * @param _target - The target method
 * @param _propertyKey - The property key
 */
export function External(_target: any, _propertyKey: string): any {}

/**
 * Marks a method as public
 * @param _target - The target method
 */
export function Public(_target: any): any {}

/**
 * Marks a method as read-only (does not modify state)
 * @param _target - The target method
 * @param _propertyKey - The property key
 */
export function View(_target: any, _propertyKey: string): any {}

/**
 * Marks a method as pure (does not read or modify state)
 * @param _target - The target method
 */
export function Pure(_target: any): any {}

/**
 * Marks a method as payable (can receive ETH)
 * @param _target - The target method
 */
export function Payable(_target: any): any {}

/**
 * Marks a method as non-payable (cannot receive ETH)
 * @param _target - The target method
 */
export function Nonpayable(_target: any): any {}

/**
 * Marks an event field as indexed (for efficient filtering)
 */
export function Indexed(_target: any, _propertyKey: string): any {}
