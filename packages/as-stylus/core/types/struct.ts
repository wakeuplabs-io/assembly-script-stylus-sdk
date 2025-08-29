import { Boolean } from "./boolean";
import { Str } from "./str";
import { storeU32BE, loadU32BE } from "../modules/endianness";
import {
  storage_load_bytes32,
  storage_cache_bytes32,
  storage_flush_cache,
} from "../modules/hostio";
import { malloc } from "../modules/memory";
import { createStorageKey } from "../modules/storage";

export class Struct {
  /**
   * Allocates and zero-initializes memory for a struct
   * @param sz - Size in bytes to allocate
   * @returns Pointer to the allocated memory
   */
  static alloc(sz: u32): usize {
    const p = malloc(sz);
    memory.fill(p, 0, sz);
    return p;
  }

  /**
   * Copies memory from source to destination
   * @param d - Destination pointer
   * @param s - Source pointer
   * @param sz - Size in bytes to copy
   */
  static copy(d: usize, s: usize, sz: u32): void {
    memory.copy(d, s, sz);
  }

  /**
   * Gets a pointer to a field within a struct
   * @param ptr - Base struct pointer
   * @param off - Field offset in bytes
   * @returns Pointer to the field
   */
  static getField(ptr: usize, off: u32): usize {
    return ptr + off;
  }

  /**
   * Loads struct data from contract storage
   * @param ptr - Destination pointer
   * @param slot - Storage slot identifier
   */
  static loadFromStorage(ptr: usize, slot: u64): void {
    storage_load_bytes32(createStorageKey(slot), ptr);
  }

  /**
   * Stores struct data to contract storage
   * @param ptr - Source data pointer
   * @param slot - Storage slot identifier
   */
  static storeToStorage(ptr: usize, slot: u64): void {
    storage_cache_bytes32(createStorageKey(slot), ptr);
  }

  /**
   * Flushes cached storage operations
   */
  static flushStorage(): void {
    storage_flush_cache(0);
  }

  /**
   * Sets an address field in a struct and stores to storage
   * @param p - Struct pointer
   * @param v - Address value pointer
   * @param slot - Storage slot identifier
   */
  static setAddress(p: usize, v: usize, slot: u64): void {
    for (let i = 0; i < 43; i++) store<u8>(p + i, load<u8>(v + i));
    storage_cache_bytes32(createStorageKey(slot), p);
    storage_flush_cache(0);
  }

  /**
   * Sets a string field in a struct and stores to storage
   * @param ptr - Struct pointer
   * @param strObj - String object pointer
   * @param slot - Storage slot identifier
   */
  static setString(ptr: usize, strObj: usize, slot: u64): void {
    Str.storeTo(slot, strObj);
    for (let i = 0; i < 32; i++) store<u8>(ptr + i, 0);
    storeU32BE(ptr + 28, strObj as u32);
  }

  /**
   * Sets a string field in a struct and stores to storage
   * @param ptr - Struct pointer
   * @param strObj - String object pointer
   * @param slot - Storage slot identifier
   */
  static setMemoryString(ptr: usize, strObj: usize): void {
    memory.copy(ptr, strObj, 32);
  }

  /**
   * Sets a U256 field and stores to storage
   * @param slot - Storage slot identifier
   * @param v - U256 value pointer
   */
  static setU256(slot: u64, v: usize): void {
    storage_cache_bytes32(createStorageKey(slot), v);
    storage_flush_cache(0);
  }

  /**
   * Sets a boolean field and stores to storage
   * @param slot - Storage slot identifier
   * @param v - Boolean value pointer
   */
  static setBoolean(slot: u64, v: usize): void {
    storage_cache_bytes32(createStorageKey(slot), v);
    storage_flush_cache(0);
  }

  /**
   * Encodes a struct with dynamic data for ABI compatibility
   * @param structPtr - Base struct pointer (modified in place)
   * @param stringFieldOffset - Offset of string field in the struct
   * @param stringABIBlob - Pointer to ABI-encoded string data
   * @returns Total size of the encoded struct
   */
  static encodeStructForABI(structPtr: usize, stringFieldOffset: u32, stringABIBlob: usize): u32 {
    const baseSize: u32 = 160;

    for (let i = 0; i < 32; i++) store<u8>(structPtr + stringFieldOffset + i, 0);
    storeU32BE(structPtr + stringFieldOffset + 28, baseSize);

    const strLen: u32 = loadU32BE(stringABIBlob + 0x20 + 28);
    const paddedLen = (strLen + 31) & ~31;

    const stringDataPtr = structPtr + baseSize;
    for (let i = 0; i < 32; i++) store<u8>(stringDataPtr + i, 0);
    storeU32BE(stringDataPtr + 28, strLen);

    const stringContentPtr = stringDataPtr + 32;
    for (let i: u32 = 0; i < paddedLen; i++) {
      store<u8>(stringContentPtr + i, load<u8>(stringABIBlob + 0x40 + i));
    }

    return baseSize + 32 + paddedLen;
  }

  /**
   * Retrieves a string from storage and converts to ABI format
   * @param slot - Storage slot identifier
   * @returns Pointer to ABI-encoded string data
   */
  static getString(slot: u64): usize {
    return Str.loadFrom(slot);
  }

  /**
   * Gets a string from a struct field and converts to ABI format
   * @param ptr - Struct pointer
   * @param offset - Field offset in the struct
   * @returns Pointer to ABI-encoded string data, or 0 if null
   */
  static getStringFromField(ptr: usize, offset: u32): usize {
    const stringPtr = load<usize>(ptr + offset);
    if (stringPtr != 0) {
      return Str.rawStringToABI(stringPtr);
    }
    return 0;
  }

  /**
   * Retrieves a U256 value from storage
   * @param slot - Storage slot identifier
   * @returns Pointer to the retrieved U256 value
   */
  static getU256(slot: u64): usize {
    const out = malloc(32);
    storage_load_bytes32(createStorageKey(slot), out);
    return out;
  }

  /**
   * Retrieves a boolean value from storage
   * @param slot - Storage slot identifier
   * @returns Pointer to the retrieved boolean value
   */
  static getBoolean(slot: u64): boolean {
    const out = malloc(32);
    storage_load_bytes32(createStorageKey(slot), out);
    return Boolean.fromABI(out);
  }
}
