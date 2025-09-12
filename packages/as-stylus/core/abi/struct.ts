import { storeU32BE } from "../modules/endianness";
import { malloc } from "../modules/memory";

export class StructABI {
  /**
   * Allocates and zero-initializes memory for a struct
   * @param sz - Size in bytes to allocate
   * @returns Pointer to the allocated memory
   */
  static alloc(sz: u32): usize {
    const p = malloc(32 + sz);
    memory.fill(p, 0, 32 + sz);
    store<u8>(p + 31, 0x20);
    return p;
  }

  /**
   * Sets a string field in a struct memory with ABI format
   * @param ptr - Struct pointer (where to write the offset)
   * @param strObj - String object pointer (AssemblyScript string format)
   */
  static setString(base: usize, ptr: usize, strObj: usize, offset: u32): void {
    const strLen: u32 = load<u32>(strObj);
    const dataValuePtr = strObj + 4;

    // Set offset pointer in the struct field (points to where string data starts)
    for (let i = 0; i < 32; i++) store<u8>(ptr + i, 0);
    storeU32BE(ptr + 28, offset);

    const stringDataPtr = base + offset;

    // Write string length in 32 bytes (ABI format)
    for (let i = 0; i < 32; i++) store<u8>(stringDataPtr + i, 0);
    storeU32BE(stringDataPtr + 28, strLen);

    // Write actual string content after the 32-byte length
    const stringContentPtr = stringDataPtr + 32;
    for (let i: u32 = 0; i < strLen; i++) {
      store<u8>(stringContentPtr + i, load<u8>(dataValuePtr + i));
    }
  }

  /**
   * Sets a field in a struct memory (copies 32 bytes from fieldPtr to ptr)
   * @param ptr - Struct field pointer (where to write the data)
   * @param fieldPtr - Field data pointer (source of the data)
   */
  static setField(ptr: usize, fieldPtr: usize): void {
    for (let i = 0; i < 32; i++) {
      store<u8>(ptr + i, load<u8>(fieldPtr + i));
    }
  }
}
