import { U256 } from "./u256.js";

/**
 * @interface Str
 * @description Interface for a string
 * @property {U256} length - Get the length of the string
 * @property {Str} slice - Slice the string
 */
export class Str {
  length(): U256 {
    throw new Error("Method not implemented.");
  }

  slice(_offset: U256, _length: U256): Str {
    throw new Error("Method not implemented.");
  }

  /**
   * @method equals
   * @description Check if two strings are equal
   * @param {Str} other - The other string
   * @returns {boolean} True if the strings are equal, false otherwise
   */
  equals(_other: Str): boolean {
    throw new Error("Method not implemented.");
  }

  /**
   * @method toString
   * @description Convert the Str instance to a string
   * @returns {string} The string
   */
  toString(): string {
    throw new Error("Method not implemented.");
  }
}

/**
 * @class StrFactory
 * @description Factory for creating strings
 * @method create - Create a new string
 * @method fromUtf8 - Create a string from a UTF-8 encoded byte array
 * @method fromString - Create a string from a string
 */
export class StrFactory {
  /**
   * @method create
   * @description Create a new string
   * @returns {Str} A new string
   */
  static create(): Str {
    throw new Error("Method not implemented.");
  }

  /**
   * @method fromUtf8
   * @description Create a string from a UTF-8 encoded byte array
   * @param {Uint8Array} bytes - The UTF-8 encoded byte array
   * @returns {Str} A new string
   */
  static fromUtf8(_bytes: Uint8Array): Str {
    throw new Error("Method not implemented.");
  }

  /**
   * @method fromString
   * @description Create a string from a string
   * @param {string} value - The string to create
   * @returns {Str} A new string
   */
  static fromString(_value: string): Str {
    throw new Error("Method not implemented.");
  }
}
