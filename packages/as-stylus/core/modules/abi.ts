import { malloc } from "./memory";

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
}

/**
 * ABI encoding and decoding utilities for external contract calls
 */
export class ABI {
  /**
   * Encodes a function call with method signature and arguments
   * @param methodSignature - Function signature like "transfer(address,uint256)"
   * @param args - Array of argument values (for now just placeholders)
   * @returns Encoded calldata structure
   */
  static encodeCall(methodSignature: string, args: string[]): Calldata {
    const methodSelector = ABI.getMethodSelector(methodSignature);
    
    const argsSize = args.length * 32;
    const totalSize = 4 + argsSize;
    
    const calldata = malloc(totalSize);
    
    store<u32>(calldata, methodSelector);
    
    for (let i = 0; i < args.length; i++) {
      const argPtr = calldata + 4 + (i * 32);
      memory.fill(argPtr, 0, 32);
    }
    
    return new Calldata(calldata, totalSize);
  }

  /**
   * Gets the 4-byte method selector from a function signature using simple hash
   * @param methodSignature - Function signature like "transfer(address,uint256)"
   * @returns 4-byte method selector as u32
   */
  static getMethodSelector(methodSignature: string): u32 {
    let hash: u32 = 0;
    for (let i = 0; i < methodSignature.length; i++) {
      hash = hash * 31 + methodSignature.charCodeAt(i);
    }
    return hash;
  }

  /**
   * Decodes return data based on expected type
   * @param returnData - Return data from contract call
   * @param returnType - Expected return type ("U256", "bool", "address", "string")
   * @returns Decoded value as usize pointer to the decoded type
   */
  static decodeReturn(returnData: usize, returnType: string): usize {
    if (returnData == 0) {
      return ABI.getDefaultValuePtr(returnType);
    }
    
    if (returnType == "U256") {
      return ABI.decodeU256(returnData);
    } else if (returnType == "bool") {
      const boolValue = load<u8>(returnData + 31) != 0;
      return boolValue ? 1 : 0;
    } else if (returnType == "Address") {
      return ABI.decodeAddress(returnData);
    } else if (returnType == "string") {
      return ABI.decodeStringPtr(returnData);
    } else if (returnType == "u8") {
      return load<u8>(returnData + 31) as usize;
    } else {
      return ABI.decodeU256(returnData);
    }
  }

  /**
   * Decodes string return data
   * @param returnData - Return data pointer
   * @returns Decoded string
   */
  private static decodeString(returnData: usize): string {
    const offset = load<u32>(returnData + 28);
    const length = load<u32>(returnData + offset + 28);
    const dataPtr = returnData + offset + 32;
    
    const stringBytes = new Uint8Array(length as i32);
    for (let i = 0; i < length; i++) {
      stringBytes[i] = load<u8>(dataPtr + i);
    }
    
    return String.UTF8.decode(stringBytes.buffer);
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
    // Create a new U256 and copy the return data to it
    const u256Ptr = malloc(32);
    memory.copy(u256Ptr, returnData, 32);
    return u256Ptr;
  }

  /**
   * Decodes Address from return data
   */
  private static decodeAddress(returnData: usize): usize {
    const addrPtr = malloc(32);
    memory.copy(addrPtr, returnData, 32);
    return addrPtr;
  }

  /**
   * Decodes string from return data as pointer
   */
  private static decodeStringPtr(returnData: usize): usize {
    const offset = load<u32>(returnData + 28);
    const length = load<u32>(returnData + offset + 28);
    const dataPtr = returnData + offset + 32;
    
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