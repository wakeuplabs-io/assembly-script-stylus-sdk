import { U256 } from "./u256.js";

export interface StaticArrayFactory {
  create<T>(values: T[]): T[];

  filled<T>(value: T, length: U256): T[];

  from<T>(...values: T[]): T[];
}
