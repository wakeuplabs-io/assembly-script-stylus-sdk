/**
 * @interface Address
 * @description Interface for an address
 * @property {Address} clone - Clone the address
 * @property {string} toString - Convert the address to a string
 * @property {boolean} isZero - Check if the address is zero
 * @property {boolean} equals - Check if the address is equal to another address
 */
export interface Address {
  clone(): Address;
  toString(): string;
  isZero(): boolean;
  equals(other: Address): boolean;
}

/**
 * @class AddressFactory
 * @description Factory for creating addresses
 * @method fromString - Create an address from a string
 * @method create - Create a new address
 */
export class AddressFactory {
  static fromString(_hex: string): Address {
    throw new Error("Method not implemented.");
  }

  static create(): Address {
    throw new Error("Method not implemented.");
  }
}
