import { U256 } from "./u256.interface.js";

export interface Str {
  length(): U256;
  slice(offset: U256, length: U256): Str;
}

export interface StrFactory {
  create(): Str;
  fromUtf8(bytes: Uint8Array): Str;
  fromString(value: string): Str;
}
