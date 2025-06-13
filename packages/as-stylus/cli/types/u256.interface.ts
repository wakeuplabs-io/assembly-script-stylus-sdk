export interface U256 {
  add(other: U256): U256;
  sub(other: U256): U256;
  lessThan(other: U256): boolean;
  toString(): string;
}

export interface U256Factory {
  create(): U256;
  fromString(value: string): U256;
}
