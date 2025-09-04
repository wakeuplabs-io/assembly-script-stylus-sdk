import { malloc } from "./memory";
import { Boolean } from "../types/boolean";

/**
 * Simple calldata structure for external calls
 */
export class Calldata {
  ptr: usize;
  len: usize;
  
  constructor(ptr: usize, len: usize) {
    this.ptr = ptr;
    this.len = len;
  }

  /**
   * Creates a calldata structure safely without using new
   * Layout: [ptr:usize][len:usize] = 16 bytes total
   * @param dataPtr - Pointer to the calldata bytes
   * @param dataLen - Length of calldata
   * @returns Pointer to calldata structure
   */
  static create(dataPtr: usize, dataLen: usize): usize {
    const ptr = malloc(16); // usize + usize = 16 bytes on wasm64, 8 on wasm32
    
    store<usize>(ptr, dataPtr);     // Store data pointer
    store<usize>(ptr + 8, dataLen); // Store data length
    
    return ptr;
  }

  /**
   * Gets the data pointer from a calldata structure
   * @param calldataPtr - Pointer to calldata structure
   * @returns Data pointer
   */
  static getPtr(calldataPtr: usize): usize {
    return load<usize>(calldataPtr);
  }

  /**
   * Gets the data length from a calldata structure
   * @param calldataPtr - Pointer to calldata structure
   * @returns Data length
   */
  static getLen(calldataPtr: usize): usize {
    return load<usize>(calldataPtr + 8);
  }
}

/**
 * ABI encoding and decoding utilities for external contract calls
 */
export class ABI {
  /**
   * Encodes a function call with method signature and arguments
   * @param methodSignature - Function signature like "transfer(address,uint256)"
   * @param args - Array of argument pointers (usize values pointing to encoded data)
   * @returns Pointer to calldata structure
   */
  static encodeCall(methodSignature: string, args: usize[]): usize {
    const methodSelector = ABI.getMethodSelector(methodSignature);
    return ABI.encodeCallWithSelector(methodSelector, args);
  }

  /**
   * Encodes a function call with a pre-calculated selector
   * @param selector - Pre-calculated 4-byte method selector
   * @param args - Array of argument pointers (usize values pointing to encoded data)
   * @returns Pointer to calldata structure
   */
  static encodeCallWithSelector(selector: u32, args: usize[]): usize {
    
    const argsSize = args.length * 32;
    const totalSize = 4 + argsSize;
    
    const calldata = malloc(totalSize);
    
    // Store method selector (4 bytes) 
    store<u32>(calldata, selector);
    // Log el selector almacenado byte por byte

    
    // Encode each argument (32 bytes each)
    for (let i = 0; i < args.length; i++) {
      const argPtr = calldata + 4 + (i * 32);
      const argValue = args[i];
      
      if (argValue != 0) {
        // Use safe memory copy with bounds checking
        ABI.safeMemoryCopy(argPtr, argValue, 32);
      } else {
        // Fill with zeros for null arguments
        memory.fill(argPtr, 0, 32);
      }
    }
    

    
    // Usar Calldata.create() directamente sin new
    const calldataPtr = Calldata.create(calldata, totalSize);
    const actualDataPtr = Calldata.getPtr(calldataPtr);
    
    return calldataPtr;
  }

  /**
   * Known method selectors for common ERC20/ERC721 functions (Keccak256 first 4 bytes)
   * Using simple switch instead of Map for WebAssembly compatibility
   */
  private static getKnownSelector(methodSignature: string): u32 {
    // ERC20 Standard selectors
    if (methodSignature == "name()") return 0x06fdde03;
    if (methodSignature == "symbol()") return 0x95d89b41;
    if (methodSignature == "decimals()") return 0x313ce567;
    if (methodSignature == "totalSupply()") return 0x18160ddd;
    if (methodSignature == "balanceOf(address)") return 0x70a08231;
    if (methodSignature == "transfer(address,uint256)") return 0xa9059cbb;
    if (methodSignature == "allowance(address,address)") return 0xdd62ed3e;
    if (methodSignature == "approve(address,uint256)") return 0x095ea7b3;
    if (methodSignature == "transferFrom(address,address,uint256)") return 0x23b872dd;
    
    // ERC721 Standard selectors
    if (methodSignature == "ownerOf(uint256)") return 0x6352211e;
    if (methodSignature == "getApproved(uint256)") return 0x081812fc;
    if (methodSignature == "setApprovalForAll(address,bool)") return 0xa22cb465;
    if (methodSignature == "isApprovedForAll(address,address)") return 0xe985e9c5;
    if (methodSignature == "safeTransferFrom(address,address,uint256)") return 0x42842e0e;
    
    // Oracle interface selectors
    if (methodSignature == "getPrice(string)") return 0x8e15f473;
    if (methodSignature == "setPrice(string,uint256)") return 0x91b7f5ed;
    
    return 0; // Unknown selector
  }

  /**
   * Gets the 4-byte method selector from a function signature
   * @param methodSignature - Function signature like "transfer(address,uint256)"
   * @returns 4-byte method selector as u32
   */
  static getMethodSelector(methodSignature: string): u32 {
    const selector = ABI.getKnownSelector(methodSignature);
    return selector;
  }

  /**
   * Decodes return data based on expected type
   * @param returnData - Return data from contract call
   * @param returnType - Expected return type ("U256", "bool", "address", "string")
   * @returns Decoded value as usize pointer to the decoded type
   */
  static decodeReturn(returnData: usize, returnType: string): usize {
    
    // Validate returnData pointer before any memory access
    if (returnData == 0) {
      return ABI.getDefaultValuePtr(returnType);
    }
    
    if (!ABI.isValidPointer(returnData)) {
      return ABI.getDefaultValuePtr(returnType);
    }
    
    if (!ABI.isValidMemoryRange(returnData, 32)) {
      return ABI.getDefaultValuePtr(returnType);
    }
    
    
    if (returnType == "U256") {
      return ABI.decodeU256(returnData);
    } else if (returnType == "bool") {
      // Boolean is stored in the last byte of 32-byte word
      // Safely load with bounds checking
      if (!ABI.isValidMemoryRange(returnData + 31, 1)) {
        return Boolean.create(false);
      }
      const boolValue = load<u8>(returnData + 31) != 0;
      return Boolean.create(boolValue);
    } else if (returnType == "Address") {
      return ABI.decodeAddress(returnData);
    } else if (returnType == "string") {
      return ABI.decodeStringPtr(returnData);
    } else if (returnType == "u8") {
      // Safely load with bounds checking
      if (!ABI.isValidMemoryRange(returnData + 31, 1)) {
        return 0;
      }
      return load<u8>(returnData + 31) as usize;
    } else {
      return ABI.decodeU256(returnData);
    }
  }



  /**
   * Gets default value pointer for a return type
   * @param returnType - Return type
   * @returns Default value pointer
   */
  private static getDefaultValuePtr(returnType: string): usize {
    if (returnType == "U256") {
      return malloc(32); // Zero-filled by default
    } else if (returnType == "bool") {
      return 0;
    } else if (returnType == "Address") {
      return malloc(32); // Zero-filled by default
    } else if (returnType == "string") {
      return ABI.createStringFromLiteral("");
    } else if (returnType == "u8") {
      return 0;
    } else {
      return malloc(32);
    }
  }

  /**
   * Decodes U256 from return data
   */
  private static decodeU256(returnData: usize): usize {
    // Create a new U256 and safely copy the return data to it
    const u256Ptr = malloc(32);
    ABI.safeMemoryCopy(u256Ptr, returnData, 32);
    return u256Ptr;
  }

  /**
   * Decodes Address from return data
   */
  private static decodeAddress(returnData: usize): usize {
    const addrPtr = malloc(32);
    ABI.safeMemoryCopy(addrPtr, returnData, 32);
    return addrPtr;
  }

  /**
   * Decodes string from return data as pointer
   */
  private static decodeStringPtr(returnData: usize): usize {
    
    // Validate returnData pointer
    if (returnData == 0) {
      return ABI.createStringFromLiteral("");
    }
    
    // Check if we have at least 32 bytes for the offset
    const maxOffset: u32 = 0x1000; // 4KB limit for offset
    
    // Safely load offset with bounds checking
    if (!ABI.isValidMemoryRange(returnData + 28, 4)) {
      return ABI.createStringFromLiteral("");
    }
    
    const offset = load<u32>(returnData + 28);
    
    // Validate offset is reasonable - standard ABI has minimum 32 byte offset
    if (offset > maxOffset || offset < 32) {
      return ABI.createStringFromLiteral("");
    }
    
    // Calculate length pointer address
    const lengthPtr = returnData + offset + 28;
    
    // Simple bounds check - ensure we're not accessing obviously invalid memory
    if (lengthPtr > returnData + maxOffset) {
      return ABI.createStringFromLiteral("");
    }
    
    // Safely load length with bounds checking
    if (!ABI.isValidMemoryRange(lengthPtr, 4)) {
      return ABI.createStringFromLiteral("");
    }
    
    const length = load<u32>(lengthPtr);
    
    // Validate length is reasonable (max 1KB string)
    if (length > 1024 || length == 0) {
      return ABI.createStringFromLiteral("");
    }
    
    const dataPtr = returnData + offset + 32;
    
    // Additional bounds check for data pointer
    if (dataPtr > returnData + maxOffset || dataPtr + length > returnData + maxOffset) {
      return ABI.createStringFromLiteral("");
    }
    
    // Create and copy string safely
    const stringPtr = malloc(length + 32);
    store<u32>(stringPtr + 28, length);
    memory.copy(stringPtr + 32, dataPtr, length);
    
    return stringPtr;
  }


  /**
   * Creates string from literal
   */
  private static createStringFromLiteral(value: string): usize {
    const length = value.length;
    const ptr = malloc(length + 32);
    store<u32>(ptr + 28, length);
    
    for (let i = 0; i < length; i++) {
      store<u8>(ptr + 32 + i, value.charCodeAt(i));
    }
    
    return ptr;
  }

  /**
   * Safely copies memory with extensive validation
   * @param dest - Destination pointer
   * @param src - Source pointer
   * @param size - Number of bytes to copy
   */
  private static safeMemoryCopy(dest: usize, src: usize, size: u32): void {
    // If source is zero or invalid, fill destination with zeros
    if (src == 0 || !ABI.isValidPointer(src) || !ABI.isValidMemoryRange(src, size)) {
      memory.fill(dest, 0, size);
      return;
    }
    
    // Use standard memory copy if validation passes
    memory.copy(dest, src, size);
  }

  /**
   * Validates if a memory range is safe to access
   * @param ptr - Starting pointer
   * @param size - Size of memory range
   * @returns true if memory range seems valid, false otherwise
   */
  private static isValidMemoryRange(ptr: usize, size: u32): bool {
    // Check for overflow
    const endPtr = ptr + size;
    if (endPtr < ptr) {
      return false; // Overflow
    }
    
    // Check reasonable bounds
    const maxReasonableAddress = <usize>0x7FFFFFFF; // 2GB limit
    if (endPtr > maxReasonableAddress) {
      return false;
    }
    
    return true;
  }

  /**
   * Validates if a pointer is safe to access
   * @param ptr - Pointer to validate
   * @returns true if pointer seems valid, false otherwise
   */
  private static isValidPointer(ptr: usize): bool {
    // Basic pointer validation
    // AssemblyScript uses 65536 (64KB) alignment for heap start
    // Pointers below this are likely invalid
    if (ptr < 65536) {
      return false;
    }
    
    // Check if pointer is aligned to word boundary (multiple of 4)
    if (ptr % 4 != 0) {
      return false;
    }
    
    // Additional check: ensure we're not accessing beyond reasonable memory bounds
    // This is a heuristic - in real apps you might want more sophisticated checks
    const maxReasonableAddress = <usize>0x7FFFFFFF; // 2GB limit
    if (ptr > maxReasonableAddress) {
      return false;
    }
    
    return true;
  }

  /**
   * Gets the data pointer from a calldata structure
   * @param calldataPtr - Pointer to calldata structure
   * @returns Data pointer
   */
  static getPtr(calldataPtr: usize): usize {
    return load<usize>(calldataPtr);
  }

  /**
   * Gets the data length from a calldata structure
   * @param calldataPtr - Pointer to calldata structure
   * @returns Data length
   */
  static getLen(calldataPtr: usize): usize {
    return load<usize>(calldataPtr + 8);
  }

  /**
   * Encodes a single argument based on its type
   * @param value - Value to encode
   * @param type - Argument type
   * @returns Encoded 32-byte value
   */
  static encodeArg(value: string, type: string): usize {
    const encoded = malloc(32);
    
    switch (type) {
      case "address":
        // Address is padded to 32 bytes, actual address in last 20 bytes
        memory.fill(encoded, 0, 12);
        // TODO: Parse address from string and copy to encoded + 12
        break;
      case "uint256":
        // TODO: Parse U256 from value and copy to encoded
        break;
      case "bool":
        memory.fill(encoded, 0, 31);
        store<u8>(encoded + 31, value === "true" ? 1 : 0);
        break;
      default:
        memory.fill(encoded, 0, 32);
        break;
    }
    
    return encoded;
  }
}