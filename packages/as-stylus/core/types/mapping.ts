import { U256 } from "./u256";
import { mapLoad, mapStore } from "../modules/storage";

const ADDRESS_LEN: u32 = 20;
const U256_LEN: u32 = 32;

export class Mapping {
  static setU256(slot: u64, key: usize, value: usize): void {
    mapStore(slot, key, U256_LEN, value);
  }

  static getU256(slot: u64, key: usize): usize {
    const out = U256.create();
    mapLoad(slot, key, U256_LEN, out);
    return out;
  }

  static setAddress(slot: u64, key: usize, value: usize): void {
    mapStore(slot, key, ADDRESS_LEN, value);
  }

  static getAddress(slot: u64, key: usize): usize {
    const out = U256.create();
    mapLoad(slot, key, ADDRESS_LEN, out);
    return out;
  }
}
