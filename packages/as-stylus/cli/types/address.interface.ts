export interface Address {
  clone(): Address;
  toString(): string;
  isZero(): boolean;
  equals(other: Address): boolean;
  hasCode(): boolean;
}

export interface AddressFactory {
  create(): Address;
  fromString(hex: string): Address;
}
