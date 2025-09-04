import { call_contract, delegate_call_contract, static_call_contract, read_return_data, return_data_size } from "./hostio";
import { malloc } from "./memory";
const DEFAULT_GAS_LIMIT: u64 = 500_000;

export enum CallStatus {
  SUCCESS = 0,
  REVERT = 1,
  FAILURE = 2,
}

export class CallResult {
  /**
   * Creates a call result structure (16 bytes total)
   * Layout: [status:u8][returnDataLen:u32][padding:3][returnData:usize]
   * Memory layout: offset 0=status(1), offset 1=returnDataLen(4), offset 8=returnData(8)
   * @param status - Call status (0=success, 1=revert, 2=failure)
   * @param returnData - Pointer to return data
   * @param returnDataLen - Length of return data
   * @returns Pointer to call result structure
   */
  static create(status: u8, returnData: usize, returnDataLen: u32): usize {
    
    const ptr = malloc(16); // u8 + u32 + usize (8 bytes on wasm32) = 13 bytes, rounded to 16
    
    // Proper memory alignment: status:u8 at 0, returnDataLen:u32 at 1, returnData:usize at 8
    store<u8>(ptr, status);
    store<u32>(ptr + 1, returnDataLen);  // No gap - store immediately after u8
    store<usize>(ptr + 8, returnData);   // usize at 8-byte boundary for alignment
    
    return ptr;
  }

  /**
   * Checks if the call result indicates success
   * @param resultPtr - Pointer to call result structure
   * @returns true if successful
   */
  static isSuccess(resultPtr: usize): bool {
    const status = load<u8>(resultPtr);
    return status == CallStatus.SUCCESS;
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
    if (resultPtr == 0) {
      return 0;
    }
    
    const returnDataPtr = load<usize>(resultPtr + 8);
    return returnDataPtr;
  }

  /**
   * Gets the return data length from call result
   * @param resultPtr - Pointer to call result structure
   * @returns Length of return data
   */
  static getReturnDataLen(resultPtr: usize): u32 {
    return load<u32>(resultPtr + 1);  // Updated to match new memory layout
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
    // Use u32 for WASM32 compatibility (not u64)
    const outsLenPtr = malloc(4);
    store<u32>(outsLenPtr, 0);

    const status = call_contract(to, calldata, calldataLen, value, gasLimit, outsLenPtr);
    const returnDataLen = load<u32>(outsLenPtr);

    let returnDataPtr: usize = 0;
    if (status == 0 && returnDataLen > 0) {
      returnDataPtr = malloc(returnDataLen);
      read_return_data(returnDataPtr, 0, returnDataLen);
    }

    return CallResult.create(status, returnDataPtr, returnDataLen);
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
    // Use u32 for WASM32 compatibility (not u64)
    const outsLenPtr = malloc(4);
    store<u32>(outsLenPtr, 0);

    const status = delegate_call_contract(to, calldata, calldataLen, gasLimit, outsLenPtr);
    const returnDataLen = load<u32>(outsLenPtr);

    let returnDataPtr: usize = 0;
    if (status == 0 && returnDataLen > 0) {
      returnDataPtr = malloc(returnDataLen);
      read_return_data(returnDataPtr, 0, returnDataLen);
    }

    return CallResult.create(status, returnDataPtr, returnDataLen);
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
    const outsLenPtr = malloc(4);
    store<u32>(outsLenPtr, 0);
    
    const status = static_call_contract(to, calldata, calldataLen, gasLimit, outsLenPtr);
    const outsLen = load<u32>(outsLenPtr);
    const vmLen = return_data_size();
    let returnDataPtr: usize = 0;
    returnDataPtr = malloc(32);
    const written = read_return_data(returnDataPtr, 0, 0);

    let returnDataLen: u32 = 0;
    
    if (status == 0) {
      const actualLen = return_data_size();
      
      if (actualLen > 0) {
        returnDataPtr = malloc(actualLen);
        const written = read_return_data(returnDataPtr, 0, actualLen);
        returnDataLen = written;
      }
    }
    
    return CallResult.create(status, returnDataPtr, returnDataLen);
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
    
    // Use u32 for WASM32 compatibility (not u64)
    const outsLenPtr = malloc(4);
    store<u32>(outsLenPtr, 0);
    
    const status = call_contract(
      to, 
      emptyCalldata, 
      emptyCalldataLen, 
      value, 
      SEND_GAS_STIPEND, 
      outsLenPtr
    );
    
    // Opcional: leer return data para debugging (sin afectar el resultado)
    const returnDataLen = load<u32>(outsLenPtr);
    if (returnDataLen > 0) {
      const returnDataPtr = malloc(returnDataLen);
      read_return_data(returnDataPtr, 0, returnDataLen);
    }
    
    return status == CallStatus.SUCCESS;
  }
}

