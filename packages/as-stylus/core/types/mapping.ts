import { Boolean } from "./boolean";
import { I256 } from "./i256";
import { Str } from "./str";
import { U256 } from "./u256";
import {
  storage_cache_bytes32,
  storage_load_bytes32,
  storage_flush_cache,
} from "../modules/hostio";
import { malloc } from "../modules/memory";
import { mapLoad, mapStore, createMappingKey } from "../modules/storage";

const ADDRESS_LEN: u32 = 32;
const U256_LEN: u32 = 32;

export class Mapping {
  /**
   * Stores a U256 value in a mapping at the specified slot and key
   * @param slot - Storage slot identifier
   * @param key - Mapping key pointer
   * @param value - U256 value pointer to store
   */
  static setU256(slot: u64, key: usize, value: usize): void {
    mapStore(slot, key, U256_LEN, value);
  }

  /**
   * Retrieves a U256 value from a mapping at the specified slot and key
   * @param slot - Storage slot identifier
   * @param key - Mapping key pointer
   * @returns Pointer to the retrieved U256 value
   */
  static getU256(slot: u64, key: usize): usize {
    const out = U256.create();
    mapLoad(slot, key, U256_LEN, out);
    return out;
  }

  /**
   * Stores an address value in a mapping at the specified slot and key
   * @param slot - Storage slot identifier
   * @param key - Mapping key pointer
   * @param value - Address value pointer to store
   */
  static setAddress(slot: u64, key: usize, value: usize): void {
    mapStore(slot, key, ADDRESS_LEN, value);
  }

  /**
   * Retrieves an address value from a mapping at the specified slot and key
   * @param slot - Storage slot identifier
   * @param key - Mapping key pointer
   * @returns Pointer to the retrieved address value
   */
  static getAddress(slot: u64, key: usize): usize {
    const out = U256.create();
    mapLoad(slot, key, ADDRESS_LEN, out);
    return out;
  }

  static setBoolean(slot: u64, key: usize, value: boolean): void {
    mapStore(slot, key, 32, Boolean.create(value));
  }

  static getBoolean(slot: u64, key: usize): boolean {
    const out = malloc(32);
    mapLoad(slot, key, 32, out);
    return Boolean.fromABI(out);
  }

  /**
   * Stores a string value in a mapping with a string key
   * @param slot - Storage slot identifier
   * @param key - String key pointer (with length in first 4 bytes)
   * @param value - String value pointer to store
   */
  static setString(slot: u64, key: usize, value: usize): void {
    const keyLen: u32 = load<u32>(key);
    const keyPtr: usize = key + 4;
    const baseSlot = createMappingKey(slot, keyPtr, keyLen);
    Str.storeToKey(baseSlot, value);
  }

  /**
   * Stores a string value in a mapping with a raw byte key
   * @param slot - Storage slot identifier
   * @param key - Raw byte key pointer
   * @param keyLen - Length of the key in bytes
   * @param value - String value pointer to store
   */
  static setStringWithKeyLen(slot: u64, key: usize, keyLen: u32, value: usize): void {
    const baseSlot = createMappingKey(slot, key, keyLen);
    Str.storeToKey(baseSlot, value);
  }

  /**
   * Retrieves a string value from a mapping with a string key
   * @param slot - Storage slot identifier
   * @param key - String key pointer (with length in first 4 bytes)
   * @returns Pointer to the retrieved string value
   */
  static getString(slot: u64, key: usize): usize {
    const keyLen: u32 = load<u32>(key);
    const keyPtr: usize = key + 4;
    const baseSlot = createMappingKey(slot, keyPtr, keyLen);
    return Str.loadFromKey(baseSlot);
  }

  /**
   * Retrieves a string value from a mapping with a raw byte key
   * @param slot - Storage slot identifier
   * @param key - Raw byte key pointer
   * @param keyLen - Length of the key in bytes
   * @returns Pointer to the retrieved string value
   */
  static getStringWithKeyLen(slot: u64, key: usize, keyLen: u32): usize {
    const baseSlot = createMappingKey(slot, key, keyLen);
    return Str.loadFromKey(baseSlot);
  }

  /**
   * Stores a U256 value in a mapping with a string key
   * @param slot - Storage slot identifier
   * @param key - Raw byte key pointer
   * @param keyLen - Length of the key in bytes
   * @param value - U256 value pointer to store
   */
  static setU256WithStringKey(slot: u64, key: usize, keyLen: u32, value: usize): void {
    mapStore(slot, key, keyLen, value);
  }

  /**
   * Retrieves a U256 value from a mapping with a string key
   * @param slot - Storage slot identifier
   * @param key - Raw byte key pointer
   * @param keyLen - Length of the key in bytes
   * @returns Pointer to the retrieved U256 value
   */
  static getU256WithStringKey(slot: u64, key: usize, keyLen: u32): usize {
    const out = U256.create();
    mapLoad(slot, key, keyLen, out);
    return out;
  }

  /**
   * Stores an address value in a mapping with a string key
   * @param slot - Storage slot identifier
   * @param key - Raw byte key pointer
   * @param keyLen - Length of the key in bytes
   * @param value - Address value pointer to store
   */
  static setAddressWithStringKey(slot: u64, key: usize, keyLen: u32, value: usize): void {
    mapStore(slot, key, keyLen, value);
  }

  /**
   * Retrieves an address value from a mapping with a string key
   * @param slot - Storage slot identifier
   * @param key - Raw byte key pointer
   * @param keyLen - Length of the key in bytes
   * @returns Pointer to the retrieved address value
   */
  static getAddressWithStringKey(slot: u64, key: usize, keyLen: u32): usize {
    const out = U256.create();
    mapLoad(slot, key, keyLen, out);
    return out;
  }

  /**
   * Stores a boolean value in a mapping with a string key
   * @param slot - Storage slot identifier
   * @param key - Raw byte key pointer
   * @param keyLen - Length of the key in bytes
   * @param value - Boolean value to store
   */
  static setBooleanWithStringKey(slot: u64, key: usize, keyLen: u32, value: boolean): void {
    mapStore(slot, key, keyLen, Boolean.create(value));
  }

  /**
   * Retrieves a boolean value from a mapping with a string key
   * @param slot - Storage slot identifier
   * @param key - Raw byte key pointer
   * @param keyLen - Length of the key in bytes
   * @returns The retrieved boolean value
   */
  static getBooleanWithStringKey(slot: u64, key: usize, keyLen: u32): boolean {
    const out = malloc(32);
    mapLoad(slot, key, keyLen, out);
    return Boolean.fromABI(out);
  }

  /**
   * Stores an I256 value in a mapping with a string key
   * @param slot - Storage slot identifier
   * @param key - Raw byte key pointer
   * @param keyLen - Length of the key in bytes
   * @param value - I256 value pointer to store
   */
  static setI256WithStringKey(slot: u64, key: usize, keyLen: u32, value: usize): void {
    mapStore(slot, key, keyLen, value);
  }

  /**
   * Retrieves an I256 value from a mapping with a string key
   * @param slot - Storage slot identifier
   * @param key - Raw byte key pointer
   * @param keyLen - Length of the key in bytes
   * @returns Pointer to the retrieved I256 value
   */
  static getI256WithStringKey(slot: u64, key: usize, keyLen: u32): usize {
    const out = I256.create();
    mapLoad(slot, key, keyLen, out);
    return out;
  }

  /**
   * Increments a 32-byte storage key by a given offset (for struct fields in mappings)
   * @param baseKey - Base storage key (32 bytes)
   * @param offset - Offset to add (field index)
   * @returns New storage key with offset applied
   */
  private static incrementStorageKey(baseKey: usize, offset: u32): usize {
    const result = malloc(32);
    memory.copy(result, baseKey, 32);

    // Add offset to the 32-byte key (big-endian addition)
    let carry: u64 = offset;
    for (let i: i32 = 31; i >= 0 && carry > 0; i--) {
      const byte = load<u8>(result + i);
      const sum = <u64>byte + carry;
      store<u8>(result + i, <u8>(sum & 0xff));
      carry = sum >> 8;
    }

    return result;
  }

  /**
   * Checks if a pointer points to a valid string by checking the string format
   * @param ptr - Pointer to check
   * @returns True if it appears to be a valid string pointer
   */
  private static isValidStringPointer(ptr: usize): boolean {
    if (ptr == 0) return false;
    // Check if pointer is reasonable (not too large, aligned)
    if (ptr > 0x7fffffff || (ptr & 0x3) != 0) return false;
    // A string has format: [u32 length][u8... data]
    // Check if length is reasonable (< 1MB)
    const len = load<u32>(ptr);
    if (len > 0x100000) return false;
    // If length is 0, it's still a valid (empty) string
    return true;
  }

  static setStruct(slot: u64, key: usize, keyLen: u32, value: usize, structSize: u32): void {
    const numSlots = (structSize + 31) / 32; // Ceiling division
    const baseKey = createMappingKey(slot, key, keyLen);

    // Store each 32-byte chunk in consecutive slots
    for (let i: u32 = 0; i < numSlots; i++) {
      const fieldKey = i === 0 ? baseKey : Mapping.incrementStorageKey(baseKey, i);
      const fieldPtr = value + i * 32;
      const bytesToStore = i === numSlots - 1 ? structSize - i * 32 : 32;

      // Check if this field might be a string pointer (last field is often a string)
      if (bytesToStore == 32 && i == numSlots - 1) {
        const potentialStringPtr = load<usize>(fieldPtr);
        // If it looks like a string pointer, store the string separately
        if (Mapping.isValidStringPointer(potentialStringPtr)) {
          // Store the string in the next slot using Str.storeToKey
          const stringSlotKey = Mapping.incrementStorageKey(baseKey, numSlots);
          Str.storeToKey(stringSlotKey, potentialStringPtr);
          // Store zero in the struct field (we'll reconstruct the pointer on load)
          const zeroField = malloc(32);
          memory.fill(zeroField, 0, 32);
          storage_cache_bytes32(fieldKey, zeroField);
        } else {
          storage_cache_bytes32(fieldKey, fieldPtr);
        }
      } else {
        // For the last chunk, we might need to pad if it's less than 32 bytes
        if (bytesToStore < 32) {
          const padded = malloc(32);
          memory.fill(padded, 0, 32);
          memory.copy(padded, fieldPtr, bytesToStore);
          storage_cache_bytes32(fieldKey, padded);
        } else {
          storage_cache_bytes32(fieldKey, fieldPtr);
        }
      }
    }

    storage_flush_cache(0);
  }

  static getStruct(slot: u64, key: usize, keyLen: u32, structSize: u32): usize {
    const numSlots = (structSize + 31) / 32; // Ceiling division
    const out = malloc(structSize);
    const baseKey = createMappingKey(slot, key, keyLen);

    // Load each 32-byte chunk from consecutive slots
    for (let i: u32 = 0; i < numSlots; i++) {
      const fieldKey = i === 0 ? baseKey : Mapping.incrementStorageKey(baseKey, i);
      const fieldPtr = out + i * 32;
      const bytesToLoad = i === numSlots - 1 ? structSize - i * 32 : 32;

      if (bytesToLoad < 32) {
        const temp = malloc(32);
        storage_load_bytes32(fieldKey, temp);
        memory.copy(fieldPtr, temp, bytesToLoad);
      } else {
        storage_load_bytes32(fieldKey, fieldPtr);
      }
    }

    return out;
  }
}
