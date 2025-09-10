import { block_timestamp, block_number, block_coinbase, block_basefee, block_gas_limit } from "../modules/hostio";
import { malloc } from "../modules/memory";

export class Block {
  private constructor() {}

  /**
   * Gets the current block timestamp (Unix timestamp in seconds)
   * Equivalent to Solidity's block.timestamp
   * @returns Pointer to 32-byte U256 representation of block.timestamp
   */
  public static timestamp(): usize {
    const timestamp = block_timestamp();
    const ptr = malloc(32);
    
    // Clear all bytes first
    for (let i = 0; i < 32; i++) {
      store<u8>(ptr + i, 0);
    }
    
    // Store u64 in big-endian format (last 8 bytes)
    store<u64>(ptr + 24, timestamp);
    
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
    
    // Clear all bytes first
    for (let i = 0; i < 32; i++) {
      store<u8>(ptr + i, 0);
    }
    
    // Store u64 in big-endian format (last 8 bytes)
    store<u64>(ptr + 24, blockNumber);
    
    return ptr;
  }

  /**
   * Gets the current block miner's address (coinbase)
   * Equivalent to Solidity's block.coinbase
   * @returns Pointer to 32-byte address representation of block.coinbase
   */
  public static coinbase(): usize {
    const ptr = malloc(32);
    // Clear first 12 bytes (padding for address)
    for (let i = 0; i < 12; i++) {
      store<u8>(ptr + i, 0);
    }
    
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
    
    // Clear all bytes first
    for (let i = 0; i < 32; i++) {
      store<u8>(ptr + i, 0);
    }
    
    // Store u64 in big-endian format (last 8 bytes)
    store<u64>(ptr + 24, gasLimit);
    
    return ptr;
  }



  /**
   * Helper function to check if the current block has a non-zero base fee
   * Useful for detecting post-EIP-1559 blocks
   * @returns true if block.basefee > 0
   */
  public static hasBasefee(): bool {
    const basefeePtr = Block.basefee();
    
    // Check if any byte is non-zero
    for (let i = 0; i < 32; i++) {
      if (load<u8>(basefeePtr + i) !== 0) {
        return true;
      }
    }
    
    return false;
  }
}