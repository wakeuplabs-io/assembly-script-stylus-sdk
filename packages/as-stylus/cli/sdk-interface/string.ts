import { U256 } from "./u256.js";

/**
 * @interface Str
 * @description Interface for a string
 * @property {U256} length - Get the length of the string
 * @property {Str} slice - Slice the string
 */
export interface Str {
  length(): U256;
  slice(offset: U256, length: U256): Str;
}

/**
 * @interface StrFactory
 * @description Factory for creating strings
 * @method create - Create a new string
 * @method fromUtf8 - Create a string from a UTF-8 encoded byte array
 * @method fromString - Create a string from a string
 */
export interface StrFactory {
  create(): Str;
  fromUtf8(bytes: Uint8Array): Str;
  fromString(value: string): Str;
}
