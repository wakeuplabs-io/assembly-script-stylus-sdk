import { Address } from "./address.js";

/**
 * @class contract
 * @description Provides access to contract information
 * Equivalent to Solidity's contract global variable
 */
export class contract {
  /**
   * Address of the contract
   * Equivalent to Solidity's contract.address
   */
  static address: Address;
}
