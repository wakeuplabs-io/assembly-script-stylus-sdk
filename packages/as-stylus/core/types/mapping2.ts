import { Boolean } from "./boolean";
import { U256 } from "./u256";
import { mapLoadHash, mapStoreHash, createMappingKey } from "../modules/storage";

const ADDRESS_LEN: u32 = 32;

export class MappingNested {
  static setU256(slot: u64, k1: usize, k2: usize, val: usize): void {
    const slot1 = createMappingKey(slot, k1, ADDRESS_LEN);
    mapStoreHash(slot1, k2, ADDRESS_LEN, val);
  }

  static getU256(slot: u64, k1: usize, k2: usize): usize {
    const out = U256.create();
    const slot1 = createMappingKey(slot, k1, ADDRESS_LEN);
    mapLoadHash(slot1, k2, ADDRESS_LEN, out);
    return out;
  }

  static setBoolean(slot: u64, k1: usize, k2: usize, val: boolean): void {
    const slot1 = createMappingKey(slot, k1, ADDRESS_LEN);
    const boolPtr = Boolean.create(val);
    mapStoreHash(slot1, k2, ADDRESS_LEN, boolPtr);
  }

  static getBoolean(slot: u64, k1: usize, k2: usize): usize {
    const temp = Boolean.create();
    const slot1 = createMappingKey(slot, k1, ADDRESS_LEN);
    mapLoadHash(slot1, k2, ADDRESS_LEN, temp);

    // Extract the boolean value and create a clean boolean result
    const boolValue = Boolean.fromABI(temp);
    return Boolean.create(boolValue);
  }
}
