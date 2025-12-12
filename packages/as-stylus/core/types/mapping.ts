import { Boolean } from "./boolean";
import { Str } from "./str";
import { U256 } from "./u256";
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
}
