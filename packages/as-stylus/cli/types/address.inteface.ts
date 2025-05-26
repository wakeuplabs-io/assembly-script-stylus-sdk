import { U256 } from "./u256.interface";

export interface Address {
    clone(): Address;
    toString(): string;
    isZero(): boolean;
    equals(other: Address): boolean;
  }
  
  export interface AddressFactory {
    create(): Address;
    fromString(hex: string): Address;
    fromU256(value: U256): Address;
  }
  