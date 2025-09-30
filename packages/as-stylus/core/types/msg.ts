import { msg_sender, msg_value, msg_reentrant, read_args } from "../modules/hostio";
import { malloc } from "../modules/memory";

export class Msg {
  /**
   * Gets the address of the message sender (caller)
   * Equivalent to Solidity's msg.sender
   * @returns Pointer to 32-byte address representation of msg.sender
   */
  public static sender(): usize {
    const ptr = malloc(32);
    for (let i = 0; i < 12; i++) {
      store<u8>(ptr + i, 0);
    }

    msg_sender(ptr + 12);

    return ptr;
  }

  /**
   * Gets the ETH value (in wei) sent with the message
   * Equivalent to Solidity's msg.value
   * @returns Pointer to 32-byte U256 representation of msg.value
   */
  public static value(): usize {
    const ptr = malloc(32);
    msg_value(ptr);
    return ptr;
  }

  /**
   * Gets the complete calldata sent with the message
   * Equivalent to Solidity's msg.data
   * @returns Pointer to the calldata bytes
   */
  public static data(): usize {
    const ptr = malloc(4096);
    read_args(ptr);
    return ptr;
  }

  /**
   * Gets the function selector (first 4 bytes of calldata)
   * Equivalent to Solidity's msg.sig
   * @returns Pointer to 32-byte representation of msg.sig (padded)
   */
  public static sig(): usize {
    const dataPtr = Msg.data();
    const sigPtr = malloc(32);

    // Clear all bytes first (padding)
    for (let i = 0; i < 32; i++) {
      store<u8>(sigPtr + i, 0);
    }

    // Copy first 4 bytes of calldata to the end (big-endian style)
    for (let i = 0; i < 4; i++) {
      store<u8>(sigPtr + 28 + i, load<u8>(dataPtr + i));
    }

    return sigPtr;
  }

  /**
   * Checks if the current call is reentrant
   * Equivalent to checking msg.reentrant status
   * @returns Pointer to 32-byte representation (1 if reentrant, 0 if not)
   */
  public static reentrant(): usize {
    const reentrantStatus = msg_reentrant();
    const ptr = malloc(32);

    // Clear all bytes first
    for (let i = 0; i < 32; i++) {
      store<u8>(ptr + i, 0);
    }

    // Store i32 value in last 4 bytes (big-endian style)
    store<i32>(ptr + 28, reentrantStatus);

    return ptr;
  }

  /**
   * Helper function to check if any value was sent with the transaction
   * @returns true if msg.value > 0
   */
  public static hasValue(): boolean {
    const valuePtr = Msg.value();
    for (let i = 0; i < 32; i++) {
      if (load<u8>(valuePtr + i) !== 0) {
        return true;
      }
    }

    return false;
  }
}
