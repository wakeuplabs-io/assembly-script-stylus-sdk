import { malloc } from "../modules/memory";

export class Boolean {
  /**
   * Creates a 32-byte boolean representation for ABI compatibility
   * @param value - The boolean value to encode (defaults to false)
   * @returns Pointer to the newly allocated 32-byte boolean
   */
  static create(value: bool = false): usize {
    const ptr = malloc(32);
    for (let i = 0; i < 32; ++i) store<u8>(ptr + i, 0 as u8);
    store<u8>(ptr + 31, value ? (1 as u8) : (0 as u8));
    return ptr;
  }

  /**
   * Negates a boolean value
   * @param value - The boolean value to negate
   * @returns The negated boolean value
   */
  static not(value: boolean): boolean {
    return !value;
  }

  /**
   * Extracts a boolean value from ABI-encoded data
   * @param pointer - Pointer to 32-byte ABI-encoded boolean data
   * @returns The boolean value
   */
  static fromABI(pointer: usize): bool {
    return load<u8>(pointer + 31) == 1;
  }

  /**
   * Converts a boolean value to ABI-encoded format
   * @param value - The boolean value to encode
   * @returns Pointer to the newly allocated 32-byte ABI boolean
   */
  static toABI(value: bool): usize {
    return Boolean.create(value);
  }
}
