import { Address } from "./address.js";
import { Str } from "./string.js";
import { U256 } from "./u256.js";

/**
 * @interface CallResult
 * @description Result of a contract call operation
 * @method isSuccess - Check if call succeeded
 * @method isRevert - Check if call reverted
 * @method getReturnData - Get return data as string
 */
export interface CallResult {
  isSuccess(): boolean;
  isRevert(): boolean;
  getReturnData(): Str;
}

/**
 * @class CallFactory
 * @description Factory for creating contract calls
 * Provides all three types of calls: CALL, DELEGATECALL, STATICCALL
 */
export class CallFactory {
  /**
   * Performs a standard contract call (CALL opcode)
   * Can modify target contract state and transfer value
   * @param to - Target contract address
   * @param value - Wei amount to transfer
   * @param data - Encoded function call data
   * @param gasLimit - Optional gas limit (default: 500,000)
   * @returns Call result with status and return data
   */
  static call(to: Address, value: U256, data: Str, gasLimit?: U256): CallResult {
    throw new Error("Method not implemented.");
  }

  /**
   * Performs a delegate call (DELEGATECALL opcode)
   * Target contract can modify caller's storage, preserves msg.sender/msg.value
   * @param to - Target contract address
   * @param data - Encoded function call data
   * @param gasLimit - Optional gas limit (default: 500,000)
   * @returns Call result with status and return data
   */
  static delegateCall(to: Address, data: Str, gasLimit?: U256): CallResult {
    throw new Error("Method not implemented.");
  }

  /**
   * Performs a static call (STATICCALL opcode)
   * Read-only call that cannot modify state or transfer value
   * @param to - Target contract address
   * @param data - Encoded function call data
   * @param gasLimit - Optional gas limit (default: 500,000)
   * @returns Call result with status and return data
   */
  static staticCall(to: Address, data: Str, gasLimit?: U256): CallResult {
    throw new Error("Method not implemented.");
  }

  /**
   * Helper: Performs ETH transfer using call with empty data
   * @param to - Target address
   * @param value - Wei amount to transfer
   * @param gasLimit - Optional gas limit (default: 500,000)
   * @returns Call result with status and return data
   */
  static transfer(to: Address, value: U256, gasLimit?: U256): CallResult {
    throw new Error("Method not implemented.");
  }

  /**
   * Helper: Performs ETH transfer with 2300 gas stipend (Solidity .send semantics)
   * Does not revert on failure, returns boolean result
   * @param to - Target address
   * @param value - Wei amount to transfer
   * @returns true if successful, false if failed
   */
  static send(to: Address, value: U256): boolean {
    throw new Error("Method not implemented.");
  }

}
