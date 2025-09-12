import { Boolean } from "./boolean";
import { U256 } from "./u256";
import { mapLoadHash, mapStoreHash, createMappingKey } from "../modules/storage";

const ADDRESS_LEN: u32 = 32;

export class MappingNested {
  /**
   * Stores a U256 value in a nested mapping at the specified keys
   * @param slot - Storage slot identifier
   * @param k1 - First mapping key pointer
   * @param k2 - Second mapping key pointer
   * @param val - U256 value pointer to store
   */
  static setU256(slot: u64, k1: usize, k2: usize, val: usize): void {
    const slot1 = createMappingKey(slot, k1, ADDRESS_LEN);
    mapStoreHash(slot1, k2, ADDRESS_LEN, val);
  }

  /**
   * Retrieves a U256 value from a nested mapping at the specified keys
   * @param slot - Storage slot identifier
   * @param k1 - First mapping key pointer
   * @param k2 - Second mapping key pointer
   * @returns Pointer to the retrieved U256 value
   */
  static getU256(slot: u64, k1: usize, k2: usize): usize {
    const out = U256.create();
    const slot1 = createMappingKey(slot, k1, ADDRESS_LEN);
    mapLoadHash(slot1, k2, ADDRESS_LEN, out);
    return out;
  }

  /**
   * Stores a boolean value in a nested mapping at the specified keys
   * @param slot - Storage slot identifier
   * @param k1 - First mapping key pointer
   * @param k2 - Second mapping key pointer
   * @param val - Boolean value to store
   */
  static setBoolean(slot: u64, k1: usize, k2: usize, val: boolean): void {
    const slot1 = createMappingKey(slot, k1, ADDRESS_LEN);
    const boolPtr = Boolean.create(val);
    mapStoreHash(slot1, k2, ADDRESS_LEN, boolPtr);
  }

  /**
   * Retrieves a boolean value from a nested mapping at the specified keys
   * @param slot - Storage slot identifier
   * @param k1 - First mapping key pointer
   * @param k2 - Second mapping key pointer
   * @returns Pointer to the retrieved boolean value
   */
  static getBoolean(slot: u64, k1: usize, k2: usize): boolean {
    const temp = Boolean.create();
    const slot1 = createMappingKey(slot, k1, ADDRESS_LEN);
    mapLoadHash(slot1, k2, ADDRESS_LEN, temp);

    return Boolean.fromABI(temp);
  }
}
