import { malloc } from "../modules/memory";
/** Core Array operations for dynamic arrays storage management */
export class Array {
  /** Creates memory array with capacity */
  static createMemory(elementSize: u32, capacity: u32): usize {
    const headerSize = 8;
    const dataSize = elementSize * capacity;
    const ptr = malloc(headerSize + dataSize);
    store<u32>(ptr, 0);
    store<u32>(ptr + 4, capacity);
    for (let i: u32 = 0; i < dataSize; ++i) {
      store<u8>(ptr + headerSize + i, 0);
    }
    return ptr;
  }

  /** Gets array length */
  static getLength(arrayPtr: usize): u32 {
    return load<u32>(arrayPtr);
  }

  /** Gets array length as U256 for consistency with other length operations */
  static getLengthAsU256(arrayPtr: usize): usize {
    const length = load<u32>(arrayPtr);
    const u256Ptr = malloc(32);
    for (let i = 0; i < 32; ++i) store<u8>(u256Ptr + i, 0);
    store<u32>(u256Ptr + 28, length);
    return u256Ptr;
  }

  /** Gets array capacity */
  static getCapacity(arrayPtr: usize): u32 {
    return load<u32>(arrayPtr + 4);
  }

  /** Gets data section pointer */
  static getDataPtr(arrayPtr: usize): usize {
    return arrayPtr + 8;
  }

  /** Sets array length */
  static setLength(arrayPtr: usize, newLength: u32): void {
    store<u32>(arrayPtr, newLength);
  }

  /** Pushes element to array */
  static push(arrayPtr: usize, elementPtr: usize, elementSize: u32): usize {
    const length = this.getLength(arrayPtr);
    const capacity = this.getCapacity(arrayPtr);
    if (length >= capacity) {
      arrayPtr = this.grow(arrayPtr, elementSize);
    }
    const dataPtr = this.getDataPtr(arrayPtr);
    const targetPtr = dataPtr + length * elementSize;
    for (let i: u32 = 0; i < elementSize; ++i) {
      store<u8>(targetPtr + i, load<u8>(elementPtr + i));
    }
    this.setLength(arrayPtr, length + 1);
    return arrayPtr;
  }

  /** Pops element from array */
  static pop(arrayPtr: usize): u32 {
    const length = this.getLength(arrayPtr);
    if (length > 0) {
      this.setLength(arrayPtr, length - 1);
      return length - 1;
    }
    return 0;
  }

  /** Gets element at index */
  static get(arrayPtr: usize, index: u32, elementSize: u32): usize {
    const dataPtr = this.getDataPtr(arrayPtr);
    return dataPtr + index * elementSize;
  }

  /** Sets element at index */
  static set(arrayPtr: usize, index: u32, elementPtr: usize, elementSize: u32): void {
    const dataPtr = this.getDataPtr(arrayPtr);
    const targetPtr = dataPtr + index * elementSize;
    for (let i: u32 = 0; i < elementSize; ++i) {
      store<u8>(targetPtr + i, load<u8>(elementPtr + i));
    }
  }

  /** Creates array from calldata */
  static fromCalldata(basePtr: usize, offsetPtr: usize): usize {
    const offset =
      (load<u8>(offsetPtr + 28) << 24) |
      (load<u8>(offsetPtr + 29) << 16) |
      (load<u8>(offsetPtr + 30) << 8) |
      load<u8>(offsetPtr + 31);
    const arrayDataPtr = basePtr + offset;
    const arrayLength =
      (load<u8>(arrayDataPtr + 28) << 24) |
      (load<u8>(arrayDataPtr + 29) << 16) |
      (load<u8>(arrayDataPtr + 30) << 8) |
      load<u8>(arrayDataPtr + 31);
    const elementSize = 32;
    const memoryArrayPtr = this.createMemory(elementSize, arrayLength);
    this.setLength(memoryArrayPtr, arrayLength);
    const srcDataPtr = arrayDataPtr + 32;
    const destDataPtr = this.getDataPtr(memoryArrayPtr);
    const totalSize: u32 = arrayLength * elementSize;

    for (let i: u32 = 0; i < totalSize; ++i) {
      store<u8>(destDataPtr + i, load<u8>(srcDataPtr + i));
    }
    return memoryArrayPtr;
  }

  /** Grows array capacity */
  private static grow(arrayPtr: usize, elementSize: u32): usize {
    const length = this.getLength(arrayPtr);
    const oldCapacity = this.getCapacity(arrayPtr);
    const newCapacity = oldCapacity == 0 ? 4 : oldCapacity * 2;
    const newArrayPtr = this.createMemory(elementSize, newCapacity);
    this.setLength(newArrayPtr, length);
    const oldDataPtr = this.getDataPtr(arrayPtr);
    const newDataPtr = this.getDataPtr(newArrayPtr);
    const copySize = length * elementSize;
    for (let i: u32 = 0; i < copySize; ++i) {
      store<u8>(newDataPtr + i, load<u8>(oldDataPtr + i));
    }
    return newArrayPtr;
  }

  /** Serializes memory array to ABI format for return values */
  static serializeToABI(arrayPtr: usize): usize {
    // Memory array format: [length:4][capacity:4][data...]
    // ABI format for dynamic arrays: [offset_to_data=32][length][element1][element2]...[elementN]

    const length = this.getLength(arrayPtr);
    const dataPtr = this.getDataPtr(arrayPtr);

    const totalSize = 64 + length * 32;
    const buffer = malloc(totalSize);

    for (let i = 0; i < 32; ++i) store<u8>(buffer + i, 0);
    store<u8>(buffer + 31, 32); // offset = 32

    for (let i = 0; i < 32; ++i) store<u8>(buffer + 32 + i, 0);
    store<u8>(buffer + 32 + 28, <u8>((length >> 24) & 0xff));
    store<u8>(buffer + 32 + 29, <u8>((length >> 16) & 0xff));
    store<u8>(buffer + 32 + 30, <u8>((length >> 8) & 0xff));
    store<u8>(buffer + 32 + 31, <u8>(length & 0xff));

    for (let j: u32 = 0; j < length; ++j) {
      const elementOffset = j * 32;
      const bufferOffset = 64 + elementOffset;
      for (let k = 0; k < 32; ++k) {
        store<u8>(buffer + bufferOffset + k, load<u8>(dataPtr + elementOffset + k));
      }
    }

    return buffer;
  }
}
