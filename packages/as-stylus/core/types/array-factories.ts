
import { malloc } from "../modules/memory";
import { Array } from "./array";
import { ArrayStatic } from "./array-static";
import { ArrayDynamic } from "./array-dynamic";

/** Static Array Factory for fixed-size arrays */
export class StaticArrayFactory {
  /** Creates static array in memory */
  static create(elementSize: u32, length: u32): usize {
    return ArrayStatic.createMemory(elementSize, length);
  }
}

/** Dynamic Array Factory for runtime array creation */
export class DynamicArrayFactory {
  /** Creates empty dynamic array with initial capacity */
  static withCapacity(capacity: u32): usize {
    return Array.createMemory(32, capacity);
  }

  /** Creates dynamic array of specified size with default values */
  static ofSize(size: u32): usize {
    const ptr = Array.createMemory(32, size);
    Array.setLength(ptr, size);
    return ptr;
  }

  /** Creates empty dynamic array */
  static empty(): usize {
    return Array.createMemory(32, 0);
  }
}

/** Memory Array Factory for temporary array operations */
export class MemoryArrayFactory {
  /** Creates memory array of specified length */
  static ofLength(length: u32): usize {
    return Array.createMemory(32, length);
  }
}

/** U256 Array Factory for U256 specific arrays (backward compatibility) */
export class U256ArrayFactory {
  /** Creates memory array for U256 elements */
  static memory(length: u32): usize {
    return Array.createMemory(32, length);
  }

  /** Creates U256 array with specified length */
  static create(length: u32): usize {
    return Array.createMemory(32, length);
  }
}

