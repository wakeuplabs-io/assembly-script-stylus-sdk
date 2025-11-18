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
}
