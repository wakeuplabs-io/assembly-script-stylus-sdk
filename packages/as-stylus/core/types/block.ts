import { Address } from "./address";
import {
  block_timestamp,
  block_number,
  block_coinbase,
  block_basefee,
  chainid,
  block_gas_limit,
} from "../modules/hostio";
import { malloc } from "../modules/memory";

export class Block {
  private static writeU64ToU256(ptr: usize, value: u64): void {
    for (let i = 0; i < 32; i++) {
      store<u8>(ptr + i, 0);
    }

    let temp = value;
    for (let i = 0; i < 8; i++) {
      store<u8>(ptr + 31 - i, <u8>temp);
      temp >>= 8;
    }
  }

  public static chainId(): usize {
    const ptr = malloc(32);
    this.writeU64ToU256(ptr, chainid());
    return ptr;
  }
  /**
   * Gets the current block timestamp (Unix timestamp in seconds)
   * Equivalent to Solidity's block.timestamp
   * @returns Pointer to 32-byte U256 representation of block.timestamp
   */
  public static timestamp(): usize {
    const timestamp = block_timestamp();
    const ptr = malloc(32);

    this.writeU64ToU256(ptr, timestamp);

    return ptr;
  }

  /**
   * Gets the current block number
   * Equivalent to Solidity's block.number
   * @returns Pointer to 32-byte U256 representation of block.number
   */
  public static number(): usize {
    const blockNumber = block_number();
    const ptr = malloc(32);

    this.writeU64ToU256(ptr, blockNumber);

    return ptr;
  }

  /**
   * Gets the current block miner's address (coinbase)
   * Equivalent to Solidity's block.coinbase
   * @returns Pointer to 32-byte address representation of block.coinbase
   */
  public static coinbase(): usize {
    const ptr = Address.create();
    block_coinbase(ptr + 12);
    return ptr;
  }

  /**
   * Gets the current block's base fee
   * Equivalent to Solidity's block.basefee
   * @returns Pointer to 32-byte U256 representation of block.basefee
   */
  public static basefee(): usize {
    const ptr = malloc(32);
    block_basefee(ptr);
    return ptr;
  }

  /**
   * Gets the current block's gas limit
   * Equivalent to Solidity's block.gaslimit
   * @returns Pointer to 32-byte U256 representation of block.gaslimit
   */
  public static gaslimit(): usize {
    const gasLimit = block_gas_limit();
    const ptr = malloc(32);

    this.writeU64ToU256(ptr, gasLimit);

    return ptr;
  }
}
