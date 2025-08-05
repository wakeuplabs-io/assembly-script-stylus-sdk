/**
 * @interface U256
 * @description Interface for a 256-bit unsigned integer
 * @property {U256} add - Add two U256 instances
 * @property {U256} sub - Subtract one U256 from another
 * @property {boolean} greaterThan - Check if one U256 is greater than another
 * @property {boolean} greaterThanOrEqual - Check if one U256 is greater than or equal to another
 * @property {boolean} lessThan - Check if one U256 is less than another
 * @property {boolean} lessThanOrEqual - Check if one U256 is less than or equal to another
 * @property {boolean} equal - Check if one U256 is equal to another
 * @property {boolean} notEqual - Check if one U256 is not equal to another
 * @property {string} toString - Convert the U256 to a string
 */
export interface U256 {
  add(other: U256): U256;
  sub(other: U256): U256;
  mul(other: U256): U256;
  div(other: U256): U256;
  mod(other: U256): U256;
  pow(exponent: U256): U256;
  greaterThan(other: U256): boolean;
  greaterThanOrEqual(other: U256): boolean;
  lessThan(other: U256): boolean;
  lessThanOrEqual(other: U256): boolean;
  equal(other: U256): boolean;
  notEqual(other: U256): boolean;
  toString(): string;
}

/**
 * @class U256Factory
 * @description Factory for creating U256 instances
 * @method create - Create a new U256 instance
 * @method fromString - Create a U256 instance from a string
 */
export class U256Factory {
  static create(): U256 {
    throw new Error("Method not implemented.");
  }

  static fromString(_value: string): U256 {
    throw new Error("Method not implemented.");
  }
}
