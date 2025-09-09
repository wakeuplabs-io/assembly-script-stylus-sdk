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
    // For storage arrays, we need to return metadata about the base slot
    // The actual slot will be determined by the transformer
    const metadata = malloc(12); // 4 bytes elementSize + 4 bytes length + 4 bytes baseSlot
    store<u32>(metadata, elementSize);
    store<u32>(metadata + 4, length);
    store<u32>(metadata + 8, 0); // baseSlot will be set by transformer
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
    // Check if this is storage metadata (has elementSize in first 4 bytes)
    const storedElementSize = load<u32>(arrayPtr);
    if (storedElementSize == elementSize) {
      // This is storage - load from consecutive slots
      const baseSlot = load<u32>(arrayPtr + 8);
      const targetSlot = baseSlot + index;
      const slotKey = createStorageKey(targetSlot);
      const result = malloc(32);
      storage_load_bytes32(slotKey, result);
      return result;
    } else {
      // This is memory - direct pointer arithmetic
      return arrayPtr + (index * elementSize);
    }
  }

  /** Sets element at index - works for both storage and memory */
  static set(arrayPtr: usize, index: u32, elementPtr: usize, elementSize: u32): void {
    // Check if this is storage metadata
    const storedElementSize = load<u32>(arrayPtr);
    if (storedElementSize == elementSize) {
      // This is storage - store to consecutive slots
      const baseSlot = load<u32>(arrayPtr + 8);
      const targetSlot = baseSlot + index;
      const slotKey = createStorageKey(targetSlot);
      storage_cache_bytes32(slotKey, elementPtr);
      storage_flush_cache(0);
    } else {
      // This is memory - direct memory copy
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
    store<u32>(u256Ptr + 28, length);
    return u256Ptr;
  }

}