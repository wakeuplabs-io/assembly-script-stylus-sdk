/**
 * @interface I256
 * @description Interface for a 256-bit signed integer
 *
 * DEFAULT BEHAVIOR: Checked arithmetic (panic on overflow/underflow)
 * EXPLICIT UNCHECKED: Use *Unchecked methods for wrapping behavior
 *
 * @property {I256} add - Add with overflow checking (DEFAULT)
 * @property {I256} sub - Subtract with underflow checking (DEFAULT)
 * @property {I256} mul - Multiply with overflow checking (DEFAULT)
 * @property {I256} div - Divide with division-by-zero checking (DEFAULT)
 * @property {I256} mod - Modulo with division-by-zero checking (DEFAULT)
 * @property {I256} addUnchecked - Add with wrapping (EXPLICIT)
 * @property {I256} subUnchecked - Subtract with wrapping (EXPLICIT)
 * @property {I256} mulUnchecked - Multiply with wrapping (EXPLICIT)
 * @property {I256} divUnchecked - Divide returning 0 on div-by-zero (EXPLICIT)
 * @property {I256} modUnchecked - Modulo returning 0 on mod-by-zero (EXPLICIT)
 * @property {boolean} greaterThan - Check if one I256 is greater than another
 * @property {boolean} greaterThanOrEqual - Check if one I256 is greater than or equal to another
 * @property {boolean} lessThan - Check if one I256 is less than another
 * @property {boolean} lessThanOrEqual - Check if one I256 is less than or equal to another
 * @property {boolean} equals - Check if one I256 is equal to another
 * @property {boolean} isNegative - Check if I256 is negative
 * @property {I256} negate - Return negated value
 * @property {I256} abs - Return absolute value
 * @property {string} toString - Convert the I256 to a string
 */
export interface I256 {
  // DEFAULT: Checked arithmetic (panic on overflow/underflow)
  add(other: I256): I256;
  sub(other: I256): I256;
  mul(other: I256): I256;
  div(other: I256): I256;
  mod(other: I256): I256;

  // EXPLICIT: Unchecked arithmetic (wrapping behavior)
  addUnchecked(other: I256): I256;
  subUnchecked(other: I256): I256;
  mulUnchecked(other: I256): I256;
  divUnchecked(other: I256): I256;
  modUnchecked(other: I256): I256;

  // Comparison operations
  greaterThan(other: I256): boolean;
  greaterThanOrEqual(other: I256): boolean;
  lessThan(other: I256): boolean;
  lessThanOrEqual(other: I256): boolean;
  equals(other: I256): boolean;

  // Sign operations
  isNegative(): boolean;
  negate(): I256;
  abs(): I256;

  // Utility methods
  toString(): string;
  copy(): I256;
}

/**
 * @class I256Factory
 * @description Factory for creating I256 instances
 * @method create - Create a new I256 instance (zero-initialized)
 * @method fromString - Create a I256 instance from a decimal string
 * @method fromStringHex - Create a I256 instance from a hexadecimal string
 */
export class I256Factory {
  static create(): I256 {
    throw new Error("Method not implemented.");
  }

  static fromString(_value: string): I256 {
    throw new Error("Method not implemented.");
  }

  static fromStringHex(_value: string): I256 {
    throw new Error("Method not implemented.");
  }
}
