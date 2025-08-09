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
  static not(value: bool): bool {
    return !value;
  }

  /**
   * Extracts a boolean value from ABI-encoded data (idempotent)
   * @param pointer - Pointer to 32-byte ABI-encoded boolean data or boolean value
   * @returns The boolean value
   */
  static fromABI(pointer: usize): bool {
    // Only 0 and 1 are valid boolean primitive values
    // Storage pointers are always > 1 (malloc never returns 0 or 1)
    // This prevents confusion with storage slot 0 while maintaining security
    if (pointer <= 1) return pointer == 1;

    // Any value > 1 is a memory pointer - read ABI structure
    return load<u8>(pointer + 31) == 1;
  }

  /**
   * Converts a pointer to ABI-encoded format (idempotent)
   * @param value - Existing ABI pointer to validate and return
   * @returns Pointer to the ABI-encoded boolean (same or new)
   */
  static toABI(value: usize): usize {
    // Boolean primitive or low values (0-255 range)
    if (value < 256) {
      return Boolean.create(value == 1);
    }

    // Validate existing ABI structure
    // Valid ABI: first 31 bytes must be 0, last byte must be 0 or 1
    let isValidABI = true;
    for (let i = 0; i < 31; i++) {
      if (load<u8>(value + i) != 0) {
        isValidABI = false;
        break;
      }
    }

    if (isValidABI) {
      const lastByte = load<u8>(value + 31);
      if (lastByte <= 1) {
        // Valid ABI structure - return as-is
        return value;
      }
    }

    // Invalid structure - create new clean structure
    return Boolean.create(false);
  }
}
