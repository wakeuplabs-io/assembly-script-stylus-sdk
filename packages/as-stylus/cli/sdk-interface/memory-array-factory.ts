import { U256 } from "./u256.js";

export interface MemoryArrayFactory {
  ofLength<T>(length: U256, fillValue?: T): T[];
  copy<T>(source: T[]): T[];
}
