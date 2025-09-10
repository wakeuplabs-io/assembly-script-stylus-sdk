import { malloc } from "../modules/memory";
import { createStorageKey } from "../modules/storage";
import { storage_load_bytes32, storage_cache_bytes32, storage_flush_cache } from "../modules/hostio";
/** Static Array operations for fixed-size arrays */
export class ArrayStatic {
  /** 
   * Creates static array in storage with consecutive slots
   * Returns a metadata pointer containing baseSlot info
   */
  static createStorage(elementSize: u32, length: u32): usize {
    const metadata = malloc(12);
    store<u32>(metadata, elementSize);
    store<u32>(metadata + 4, length);
    store<u32>(metadata + 8, 0);
    
    return metadata;
  }

  /** Creates static array in memory */
  static createMemory(elementSize: u32, length: u32): usize {
    const totalSize = elementSize * length;
    const ptr = malloc(totalSize);
    for (let i: u32 = 0; i < totalSize; ++i) {
      store<u8>(ptr + i, 0);
    }
    return ptr;
  }

  /** Gets element at index - works for both storage and memory */
  static get(arrayPtr: usize, index: u32, elementSize: u32): usize {
    
    const storedElementSize = load<u32>(arrayPtr);
    
    if (storedElementSize == elementSize) {
      const baseSlot = load<u32>(arrayPtr + 8);
      const targetSlot = <u64>(baseSlot + index);
      
      const slotKey = createStorageKey(targetSlot);
      const result = malloc(32);
      
      storage_load_bytes32(slotKey, result);
      
      return result;
    } else {
      const result = arrayPtr + (index * elementSize);
      return result;
    }
  }

  /** Sets element at index - works for both storage and memory */
  static set(arrayPtr: usize, index: u32, elementPtr: usize, elementSize: u32): void {
    const storedElementSize = load<u32>(arrayPtr);
    
    
    if (storedElementSize == elementSize) {
      const baseSlot = load<u32>(arrayPtr + 8);
      const targetSlot = <u64>(baseSlot + index);
      const slotKey = createStorageKey(targetSlot);
      
      storage_cache_bytes32(slotKey, elementPtr);
      storage_flush_cache(1);
      
    } else {
      const targetPtr = arrayPtr + (index * elementSize);
      for (let i: u32 = 0; i < elementSize; ++i) {
        store<u8>(targetPtr + i, load<u8>(elementPtr + i));
      }
    }
  }

  /** Sets the base slot for a storage array */
  static setBaseSlot(arrayPtr: usize, baseSlot: u32): void {
    store<u32>(arrayPtr + 8, baseSlot);
  }

  /** Gets the base slot from a storage array */
  static getBaseSlot(arrayPtr: usize): u32 {
    return load<u32>(arrayPtr + 8);
  }

  /** Gets static array length as U256 for consistency */
  static getLengthAsU256(length: u32): usize {
    const u256Ptr = malloc(32);
    for (let i = 0; i < 32; ++i) store<u8>(u256Ptr + i, 0);
    store<u8>(u256Ptr + 31, <u8>length);         // LSB at position 31
    store<u8>(u256Ptr + 30, <u8>(length >> 8));  // Next byte
    store<u8>(u256Ptr + 29, <u8>(length >> 16)); // Next byte  
    store<u8>(u256Ptr + 28, <u8>(length >> 24)); // MSB at position 28
    
    return u256Ptr;
  }

}