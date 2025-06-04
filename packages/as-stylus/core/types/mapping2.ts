import { U256 } from "./u256";
import { mapLoad, mapStore, createMappingKey } from "../modules/storage";

const ADDR_LEN: u32 = 20;

export class Mapping2 {
  static set(slot: u64, k1: usize, k2: usize, val: usize): void {
    const slot1 = createMappingKey(slot, k1, ADDR_LEN);
    mapStore(slot1, k2, ADDR_LEN, val);
  }

  static get(slot: u64, k1: usize, k2: usize): usize {
    const out = U256.create();
    const slot1 = createMappingKey(slot, k1, ADDR_LEN);
    mapLoad(slot1, k2, ADDR_LEN, out);
    return out;
  }
}
