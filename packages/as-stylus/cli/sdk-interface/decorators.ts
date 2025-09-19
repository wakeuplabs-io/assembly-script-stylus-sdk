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
 * Marks a class as a struct template
 * @param _target - The target struct class
 */
export function StructTemplate(_target: any): any {}

/**
 * Marks a method as internal (callable from within the contract)
 * @param _target - The target method
 */
export function Internal(_target: any, _propertyKey: any): any {}

/**
 * Marks a method as external (callable from outside the contract)
 * @param _target - The target object
 */
export function External(_target: any, _propertyKey: any): any {}

/**
 * Marks a method as public
 * @param _target - The target method
 */
export function Public(_target: any): any {}

/**
 * Marks a method as read-only (does not modify state)
 * @param _target - The target object
 * @param _propertyKey - The property key
 */
export function View(_target: any, _propertyKey: any): any {}

/**
 * Marks a method as pure (does not read or modify state)
 * @param _target - The target method
 * @param _propertyKey - The property key
 */
export function Pure(_target: any, _propertyKey: any): any {}

/**
 * Marks a method as payable (can receive ETH)
 * @param _target - The target method
 * @param _propertyKey - The property key
 */
export function Payable(_target: any, _propertyKey: any): any {}

/**
 * Marks a method as non-payable (cannot receive ETH)
 * @param _target - The target method
 * @param _propertyKey - The property key
 */
export function Nonpayable(_target: any, _propertyKey: any): any {}

/**
 * Marks an event field as indexed (for efficient filtering)
 */
export function Indexed(_target: any, _propertyKey: string): any {}

/**
 * Marks a method as a fallback function (called when no function matches or with unknown function signatures)
 * Must be external and can optionally be payable.
 * Only one fallback function per contract is allowed.
 * @param _target - The target method
 */
export function Fallback(_target: any): any {}

/**
 * Marks a method as a receive function (called when ETH is sent with empty calldata)
 * Must be external and can optionally be payable.
 * Only one receive function per contract is allowed.
 * Cannot have parameters.
 * @param _target - The target method
 */
export function Receive(_target: any): any {}
