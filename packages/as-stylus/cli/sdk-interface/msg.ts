import { Address } from "./address.js";
import { U256 } from "./u256.js";

/**
 * @class msg
 * @description Provides access to message/transaction context information
 * Equivalent to Solidity's msg global variable
 */
export class msg {
  /**
   * Address of the message sender (caller)
   * Equivalent to Solidity's msg.sender
   */
  static sender: Address;

  /**
   * ETH value (in wei) sent with the message
   * Equivalent to Solidity's msg.value
   */
  static value: U256;

  /**
   * Complete calldata sent with the message
   * Equivalent to Solidity's msg.data
   */
  static data: Uint8Array;

  /**
   * Function selector (first 4 bytes of calldata)
   * Equivalent to Solidity's msg.sig
   */
  static sig: Uint8Array;

  /**
   * Reentrant status of the current call
   * Returns U256 (1 if reentrant, 0 if not)
   */
  static reentrant: U256;

  /**
   * Check if any value was sent with the transaction
   * Returns true if msg.value > 0
   */
  static hasValue: boolean;
}
