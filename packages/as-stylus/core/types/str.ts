import { malloc } from "../modules/memory";

/**
 * String wrapper — formato: [len: u32][bytes...]
 */
export class Str {
  /** Create an empty string */
  static create(): usize {
    const ptr = malloc(4);
    store<u32>(ptr, 0);
    return ptr;
  }

  /** Copy raw bytes from another pointer and wrap into Str layout */
  static fromBytes(src: usize, len: u32): usize {
    const totalSize = 4 + len;
    const ptr = malloc(totalSize);
    store<u32>(ptr, len);

    for (let i: u32 = 0; i < len; ++i) {
      store<u8>(ptr + 4 + i, load<u8>(src + i));
    }
    return ptr;
  }

  /** Convert Str to a JS string */
  static toString(ptr: usize): string {
    const len = load<u32>(ptr);
    return String.UTF8.decodeUnsafe(ptr + 4, len, true);
  }

  /** Get string length (number of bytes) */
  static length(ptr: usize): usize {
    const out = malloc(32); // Return a U256
    for (let i = 0; i < 32; ++i) store<u8>(out + i, 0);
    const len: u32 = load<u32>(ptr);
    store<u8>(out + 31, <u8>len);
    return out;
  }

  /** Slice a portion of the string */
  static slice(ptr: usize, offset: usize, len: usize): usize {
    const originalLen: u32 = load<u32>(ptr);
    if (offset + len > originalLen) {
      len = originalLen - offset;
    }

    const out = malloc(4 + len);
    store<u32>(out, len);

    for (let i: usize = 0; i < len; ++i) {
      const byte = load<u8>(ptr + 4 + offset + i);
      store<u8>(out + 4 + i, byte);
    }

    return out;
  }
}
