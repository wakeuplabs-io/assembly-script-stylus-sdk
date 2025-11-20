import { Boolean } from "./boolean";
import { U256 } from "./u256";
import { malloc } from "../modules/memory";
import { mapLoad, mapStore } from "../modules/storage";

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
}
