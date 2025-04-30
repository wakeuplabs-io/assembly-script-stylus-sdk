let heapPointer: usize = memory.size() << 16; 

export function malloc(size: usize): usize {
  const alignedSize: usize = (size + 7) & ~7;
  const ptr = heapPointer;
  heapPointer += alignedSize;

  const neededPages: i32 = <i32>(((heapPointer + 0xffff) >> 16) - memory.size());
  if (neededPages > 0) {
    memory.grow(neededPages);
  }

  return ptr;
}
