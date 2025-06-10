let heapPointer: usize = 0;

/**
 * Must be called **once** at the start of each transaction
 * to place the heap behind the calldata.
 *
 * @param start   Address in bytes where calldata begins
 * @param length  Length of calldata in bytes
 */
export function initHeap(start: usize, length: usize): void {
  heapPointer = (start + length + 7) & ~7;
}

/**
 * Simple bump allocator.
 * There is no `free`, because in Stylus the contract is discarded at the end
 * of the transaction.
 */
export function malloc(size: usize): usize {
  const aligned = (size + 7) & ~7;
  const ptr = heapPointer;
  heapPointer += aligned;

  const neededPages: i32 = <i32>(((heapPointer + 0xffff) >> 16) - memory.size());
  if (neededPages > 0) memory.grow(neededPages);

  return ptr;
}
