import { U256 } from "./u256";
import { mapLoad, mapStore } from "../modules/storage";

const ADDRESS_LEN: u32 = 20;

export class Mapping {
  static set(slot: u64, key: usize, value: usize): void {
    mapStore(slot, key, ADDRESS_LEN, value);
  }

  static get(slot: u64, key: usize): usize {
    const out = U256.create();
    mapLoad(slot, key, ADDRESS_LEN, out);
    return out;
  }
}
