import { U256 } from "./u256.interface.js";

export interface I256 {
  add(other: I256): I256;
  sub(other: I256): I256;
  greaterThan(other: I256): boolean;
  greaterThanOrEqual(other: I256): boolean;
  lessThan(other: I256): boolean;
  lessThanOrEqual(other: I256): boolean;
  equals(other: I256): boolean;
  notEqual(other: I256): boolean;
  toString(): string;
  isNegative(): boolean;
  negate(): I256;
  abs(): U256;
}

export interface I256Factory {
  create(): I256;
  fromString(value: string): I256;
  fromU256(value: U256): I256;
}
