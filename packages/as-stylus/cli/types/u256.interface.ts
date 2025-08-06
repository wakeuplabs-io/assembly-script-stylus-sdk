export interface U256 {
  add(other: U256): U256;
  sub(other: U256): U256;
  greaterThan(other: U256): boolean;
  greaterThanOrEqual(other: U256): boolean;
  lessThan(other: U256): boolean;
  lessThanOrEqual(other: U256): boolean;
  equals(other: U256): boolean;
  notEqual(other: U256): boolean;
  toString(): string;
}

export interface U256Factory {
  create(): U256;
  fromString(value: string): U256;
}
