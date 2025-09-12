import { U256 } from "./u256.js";

export interface DynamicArrayFactory {
  withCapacity<T>(capacity?: U256): T[];

  ofSize<T>(length: U256, fillValue?: T): T[];

  empty<T>(): T[];
}
