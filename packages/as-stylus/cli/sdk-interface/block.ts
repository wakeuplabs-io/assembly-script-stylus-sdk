import { Address } from "./address.js";
import { U256 } from "./u256.js";

/**
 * @class block
 * @description Provides access to current block information
 * Equivalent to Solidity's block global variable
 */
export class block {
  /**
   * Current block timestamp (Unix timestamp in seconds)
   * Equivalent to Solidity's block.timestamp
   */
  static timestamp: U256;

  /**
   * Current block number
   * Equivalent to Solidity's block.number
   */
  static number: U256;

  /**
   * Current block miner's address (coinbase)
   * Equivalent to Solidity's block.coinbase
   */
  static coinbase: Address;

  /**
   * Current block's base fee (EIP-1559)
   * Equivalent to Solidity's block.basefee
   */
  static basefee: U256;

  /**
   * Current block's gas limit
   * Equivalent to Solidity's block.gaslimit
   */
  static gaslimit: U256;

  /**
   * Current block's chain ID
   * Equivalent to Solidity's block.chainId
   */
  static chainId: U256;
}
