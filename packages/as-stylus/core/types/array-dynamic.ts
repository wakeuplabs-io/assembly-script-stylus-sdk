import { malloc } from "../modules/memory";
import { 
  storage_load_bytes32,
  storage_cache_bytes32,
  storage_flush_cache
} from "../modules/hostio";

/** Dynamic Array operations for variable-size arrays in storage */
export class ArrayDynamic {
  /** Creates new dynamic array in storage */
  static createStorage(): usize {
    const slot = malloc(32);
    for (let i = 0; i < 32; ++i) store<u8>(slot + i, 0);
    return slot;
  }

  /** Gets array length from storage */
  static getLength(slotPtr: usize): usize {
    const resultPtr = malloc(32);
    storage_load_bytes32(slotPtr, resultPtr);
    return resultPtr;
  }

  /** Sets array length in storage */
  static setLength(slotPtr: usize, lengthPtr: usize): void {
    storage_cache_bytes32(slotPtr, lengthPtr);
    storage_flush_cache(1);
  }

  /** Gets storage location for element at index */
  static getElementSlot(slotPtr: usize, index: usize): usize {
    const elementSlot = malloc(32);
    const hashInput = malloc(32);
    for (let i = 0; i < 32; ++i) {
      store<u8>(hashInput + i, load<u8>(slotPtr + i));
    }
    this.simpleHash(hashInput, elementSlot);
    this.addIndex(elementSlot, index);
    return elementSlot;
  }

  /** Gets element at index from storage */
  static get(slotPtr: usize, index: usize): usize {
    const elementSlot = this.getElementSlot(slotPtr, index);
    const resultPtr = malloc(32);
    storage_load_bytes32(elementSlot, resultPtr);
    return resultPtr;
  }

  /** Sets element at index in storage */
  static set(slotPtr: usize, index: usize, valuePtr: usize): void {
    const elementSlot = this.getElementSlot(slotPtr, index);
    storage_cache_bytes32(elementSlot, valuePtr);
    storage_flush_cache(1);
  }

  /** Pushes element to end of array */
  static push(slotPtr: usize, valuePtr: usize): void {
    const lengthPtr = this.getLength(slotPtr);
    this.set(slotPtr, lengthPtr, valuePtr);
    const newLengthPtr = malloc(32);
    for (let i = 0; i < 32; ++i) {
      store<u8>(newLengthPtr + i, load<u8>(lengthPtr + i));
    }
    const lastByte = load<u8>(newLengthPtr + 31);
    store<u8>(newLengthPtr + 31, lastByte + 1);
    this.setLength(slotPtr, newLengthPtr);
  }

  /** Pops element from end of array */
  static pop(slotPtr: usize): usize {
    const lengthPtr = this.getLength(slotPtr);
    let isEmpty = true;
    for (let i = 0; i < 32; ++i) {
      if (load<u8>(lengthPtr + i) != 0) {
        isEmpty = false;
        break;
      }
    }
    if (isEmpty) {
      const zero = malloc(32);
      for (let i = 0; i < 32; ++i) store<u8>(zero + i, 0);
      return zero;
    }
    const newLengthPtr = malloc(32);
    for (let i = 0; i < 32; ++i) {
      store<u8>(newLengthPtr + i, load<u8>(lengthPtr + i));
    }
    const lastByte = load<u8>(newLengthPtr + 31);
    store<u8>(newLengthPtr + 31, lastByte - 1);
    const elementValue = this.get(slotPtr, newLengthPtr);
    this.setLength(slotPtr, newLengthPtr);
    return elementValue;
  }

  /** Simple hash function placeholder */
  private static simpleHash(input: usize, output: usize): void {
    for (let i = 0; i < 32; ++i) {
      const byte = load<u8>(input + i);
      store<u8>(output + i, byte ^ 0xAA ^ <u8>i);
    }
  }

  /** Adds index to hash value */
  private static addIndex(hashPtr: usize, index: usize): void {
    let carry: u8 = 0;
    for (let i = 31; i >= 0; --i) {
      const hashByte = load<u8>(hashPtr + i);
      const indexByte = i < 32 ? load<u8>(index + i) : 0;
      const sum = hashByte + indexByte + carry;
      store<u8>(hashPtr + i, <u8>sum);
      carry = sum > 255 ? 1 : 0;
    }
  }
}