/**
 * @interface U256
 * @description Interface for a 256-bit unsigned integer
 * 
 * DEFAULT BEHAVIOR: Checked arithmetic (panic on overflow/underflow)
 * EXPLICIT UNCHECKED: Use *Unchecked methods for wrapping behavior
 * 
 * @property {U256} add - Add with overflow checking (DEFAULT)
 * @property {U256} sub - Subtract with underflow checking (DEFAULT)
 * @property {U256} mul - Multiply with overflow checking (DEFAULT)
 * @property {U256} div - Divide with division-by-zero checking (DEFAULT)
 * @property {U256} mod - Modulo with division-by-zero checking (DEFAULT)
 * @property {U256} pow - Power with overflow checking (DEFAULT)
 * @property {U256} addUnchecked - Add with wrapping (EXPLICIT)
 * @property {U256} subUnchecked - Subtract with wrapping (EXPLICIT)
 * @property {U256} mulUnchecked - Multiply with wrapping (EXPLICIT)
 * @property {U256} divUnchecked - Divide returning 0 on div-by-zero (EXPLICIT)
 * @property {U256} modUnchecked - Modulo returning 0 on mod-by-zero (EXPLICIT)
 * @property {U256} powUnchecked - Power with wrapping (EXPLICIT)
 * @property {boolean} greaterThan - Check if one U256 is greater than another
 * @property {boolean} greaterThanOrEqual - Check if one U256 is greater than or equal to another
 * @property {boolean} lessThan - Check if one U256 is less than another
 * @property {boolean} lessThanOrEqual - Check if one U256 is less than or equal to another
 * @property {boolean} equals - Check if one U256 is equal to another
 * @property {string} toString - Convert the U256 to a string
 */
export interface U256 {
  // DEFAULT: Checked arithmetic (panic on overflow/underflow)
  add(other: U256): U256;
  sub(other: U256): U256;
  mul(other: U256): U256;
  div(other: U256): U256;
  mod(other: U256): U256;
  pow(exponent: U256): U256;
  
  // EXPLICIT: Unchecked arithmetic (wrapping behavior)
  addUnchecked(other: U256): U256;
  subUnchecked(other: U256): U256;
  mulUnchecked(other: U256): U256;
  divUnchecked(other: U256): U256;
  modUnchecked(other: U256): U256;
  powUnchecked(exponent: U256): U256;
  
  // Comparison operations
  greaterThan(other: U256): boolean;
  greaterThanOrEqual(other: U256): boolean;
  lessThan(other: U256): boolean;
  lessThanOrEqual(other: U256): boolean;
  equals(other: U256): boolean;
  notEqual(other: U256): boolean;
  
  // Utility methods
  toString(): string;
  copy(): U256;
}

/**
 * @class U256Factory
 * @description Factory for creating U256 instances
 * @method create - Create a new U256 instance (zero-initialized)
 * @method fromString - Create a U256 instance from a decimal string
 * @method fromStringHex - Create a U256 instance from a hexadecimal string
 */
export class U256Factory {
  static create(): U256 {
    throw new Error("Method not implemented.");
  }

  static fromString(_value: string): U256 {
    throw new Error("Method not implemented.");
  }

  static fromStringHex(_value: string): U256 {
    throw new Error("Method not implemented.");
  }
}