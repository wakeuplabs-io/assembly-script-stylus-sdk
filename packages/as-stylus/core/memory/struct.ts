import { Boolean } from "../types/boolean";
import { Str } from "../types/str";

export class StructMemory {
  /**
   * Gets a pointer to a field within a struct
   * @param ptr - Base struct pointer
   * @param off - Field offset in bytes
   * @returns Pointer to the field
   */
  static getField(ptr: usize, off: u32): usize {
    return ptr + off;
  }

  /**
   * Sets a field in a struct memory (copies 32 bytes from fieldPtr to ptr)
   * @param ptr - Struct base pointer (where to write the data)
   * @param off - Field offset in bytes
   * @param source - Field data pointer (source of the data)
   */
  static setField(destination: usize, off: u32, source: usize): void {
    for (let i = 0; i < 32; i++) {
      store<u8>(destination + off + i, load<u8>(source + i));
    }
  }

  /**
   * Sets a string field in a struct memory with ABI format
   * @param ptr - Struct base pointer (where to write the offset)
   * @param off - Field offset in bytes
   * @param strObj - String object pointer (AssemblyScript string format)
   */
  static setString(base: usize, offset: usize, strObj: usize): void {
    const strLen: u32 = load<u32>(strObj);
    const dataValuePtr = strObj + 4;

    const pointer = Str.fromBytes(dataValuePtr, strLen);
    store<usize>(base + offset, pointer);
  }

  /**
   * Retrieves a string field from a struct memory in ABI format
   * @param base - Struct base pointer
   * @param offset - Field offset in bytes
   * @returns Pointer to the string object (AssemblyScript string format)
   */
  static getString(base: usize, offset: usize): usize {
    const pointer = load<usize>(base + offset);
    return pointer;
  }

  /**
   * Retrieves the length of a string field from a struct memory in ABI format
   * @param base - Struct base pointer
   * @param offset - Field offset in bytes
   * @returns Length of the string
   */
  static getStringLength(base: usize, offset: usize): u32 {
    const pointer = load<usize>(base + offset);
    return load<u32>(pointer);
  }

  /**
   * Retrieves a boolean value from storage
   * @param slot - Storage slot identifier
   * @returns Pointer to the retrieved boolean value
   */
  static getBoolean(base: usize, offset: usize): boolean {
    return Boolean.fromABI(base + offset);
  }
}
