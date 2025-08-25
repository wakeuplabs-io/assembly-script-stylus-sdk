import { call_contract, delegate_call_contract, static_call_contract, read_return_data } from "./hostio";
import { malloc } from "./memory";

const DEFAULT_GAS_LIMIT: u64 = 500_000;

export enum CallStatus {
  SUCCESS = 0,
  REVERT = 1,
  FAILURE = 2,
}

export class CallResult {
  /**
   * Creates a call result structure (12 bytes total)
   * Layout: [status:u8][returnDataLen:u32][returnData:usize]
   * @param status - Call status (0=success, 1=revert, 2=failure)
   * @param returnData - Pointer to return data
   * @param returnDataLen - Length of return data
   * @returns Pointer to call result structure
   */
  static create(status: u8, returnData: usize, returnDataLen: u32): usize {
    const ptr = malloc(16); // u8 + u32 + usize (8 bytes on wasm32) = 13 bytes, rounded to 16
    
    store<u8>(ptr, status);
    store<u32>(ptr + 4, returnDataLen);
    store<usize>(ptr + 8, returnData);
    
    return ptr;
  }

  /**
   * Checks if the call result indicates success
   * @param resultPtr - Pointer to call result structure
   * @returns true if successful
   */
  static isSuccess(resultPtr: usize): bool {
    return load<u8>(resultPtr) == CallStatus.SUCCESS;
  }

  /**
   * Checks if the call result indicates revert
   * @param resultPtr - Pointer to call result structure
   * @returns true if reverted
   */
  static isRevert(resultPtr: usize): bool {
    return load<u8>(resultPtr) == CallStatus.REVERT;
  }

  /**
   * Gets the return data pointer from call result
   * @param resultPtr - Pointer to call result structure
   * @returns Pointer to return data
   */
  static getReturnData(resultPtr: usize): usize {
    return load<usize>(resultPtr + 8);
  }

  /**
   * Gets the return data length from call result
   * @param resultPtr - Pointer to call result structure
   * @returns Length of return data
   */
  static getReturnDataLen(resultPtr: usize): u32 {
    return load<u32>(resultPtr + 4);
  }
}

export class Calls {
  /**
   * Performs a standard contract call (equivalent to EVM's CALL opcode)
   * Can modify target contract's state and transfer value
   * 
   * @param to - Target contract address (20 bytes)
   * @param calldata - Encoded function call data
   * @param calldataLen - Length of calldata
   * @param value - Wei amount to transfer (32 bytes)
   * @param gasLimit - Gas limit for the call
   * @returns Pointer to CallResult structure
   */
  static call(
    to: usize,
    calldata: usize,
    calldataLen: usize,
    value: usize,
    gasLimit: u64 = DEFAULT_GAS_LIMIT
  ): usize {
    const outsLenPtr = malloc(8);
    store<u64>(outsLenPtr, 0);

    const status = call_contract(to, calldata, calldataLen, value, gasLimit, outsLenPtr);
    const returnDataLen = load<u64>(outsLenPtr);

    let returnDataPtr: usize = 0;
    if (returnDataLen > 0) {
      returnDataPtr = malloc(<i32>returnDataLen);
      const written = read_return_data(returnDataPtr, 0, <i32>returnDataLen);
    }

    return CallResult.create(status, returnDataPtr, <u32>returnDataLen);
  }

  /**
   * Performs a delegate call (equivalent to EVM's DELEGATECALL opcode)
   * Target contract can modify caller's storage, preserves msg.sender and msg.value
   * Cannot transfer value
   * 
   * @param to - Target contract address (20 bytes) 
   * @param calldata - Encoded function call data
   * @param calldataLen - Length of calldata
   * @param gasLimit - Gas limit for the call
   * @returns Pointer to CallResult structure
   */
  static delegateCall(
    to: usize,
    calldata: usize,
    calldataLen: usize,
    gasLimit: u64 = DEFAULT_GAS_LIMIT
  ): usize {
    const outsLenPtr = malloc(8);
    store<u64>(outsLenPtr, 0);

    const status = delegate_call_contract(to, calldata, calldataLen, gasLimit, outsLenPtr);
    const returnDataLen = load<u64>(outsLenPtr);

    let returnDataPtr: usize = 0;
    if (returnDataLen > 0) {
      returnDataPtr = malloc(<i32>returnDataLen);
      const written = read_return_data(returnDataPtr, 0, <i32>returnDataLen);
    }

    return CallResult.create(status, returnDataPtr, <u32>returnDataLen);
  }

  /**
   * Performs a static call (equivalent to EVM's STATICCALL opcode)
   * Read-only call that cannot modify state or transfer value
   * 
   * @param to - Target contract address (20 bytes)
   * @param calldata - Encoded function call data  
   * @param calldataLen - Length of calldata
   * @param gasLimit - Gas limit for the call
   * @returns Pointer to CallResult structure
   */
  static staticCall(
    to: usize,
    calldata: usize,
    calldataLen: usize,
    gasLimit: u64 = DEFAULT_GAS_LIMIT
  ): usize {
    const outsLenPtr = malloc(8);
    store<u64>(outsLenPtr, 0);

    const status = static_call_contract(to, calldata, calldataLen, gasLimit, outsLenPtr);
    const returnDataLen = load<u64>(outsLenPtr);

    let returnDataPtr: usize = 0;
    if (returnDataLen > 0) {
      returnDataPtr = malloc(<i32>returnDataLen);
      const written = read_return_data(returnDataPtr, 0, <i32>returnDataLen);
    }

    return CallResult.create(status, returnDataPtr, <u32>returnDataLen);
  }

  /**
   * Helper function to perform a simple value transfer (ETH transfer)
   * Uses call() with empty calldata
   * 
   * @param to - Target address (20 bytes)
   * @param value - Wei amount to transfer (32 bytes)
   * @param gasLimit - Gas limit for the call
   * @returns Pointer to CallResult structure
   */
  static transfer(
    to: usize,
    value: usize,
    gasLimit: u64 = DEFAULT_GAS_LIMIT
  ): usize {
    const emptyCalldata: usize = 0;
    const emptyCalldataLen: usize = 0;

    return Calls.call(to, emptyCalldata, emptyCalldataLen, value, gasLimit);
  }


  /**
   * Performs ETH transfer with 2300 gas stipend (Solidity address.send semantics)
   * Does not revert on failure, returns boolean result
   * Equivalent to Solidity's address(to).send(value)
   * 
   * @param to - Target address (20 bytes)
   * @param value - Wei amount to transfer (32 bytes)
   * @returns true if successful, false if failed
   */
  static send(to: usize, value: usize): bool {
    const SEND_GAS_STIPEND: u64 = 2300;
    const emptyCalldata: usize = 0;
    const emptyCalldataLen: usize = 0;
    
    const outsLenPtr = malloc(8);
    store<u64>(outsLenPtr, 0);
    
    const status = call_contract(
      to, 
      emptyCalldata, 
      emptyCalldataLen, 
      value, 
      SEND_GAS_STIPEND, 
      outsLenPtr
    );
    
    // Opcional: leer return data para debugging (sin afectar el resultado)
    const returnDataLen = load<u64>(outsLenPtr);
    if (returnDataLen > 0) {
      const returnDataPtr = malloc(<i32>returnDataLen);
      read_return_data(returnDataPtr, 0, <i32>returnDataLen);
    }
    
    return status == CallStatus.SUCCESS;
  }
}

