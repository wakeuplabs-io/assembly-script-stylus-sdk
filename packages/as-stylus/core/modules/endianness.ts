// BE = Big Endian - Functions to load/store 32-bit integers in big-endian format
// Used by Stylus/AssemblyScript for consistent byte ordering when reading/writing memory
// Big-endian stores the most significant byte first, which is common in networking/storage
export function loadU32BE(ptr: usize): u32 {
  return (
    ((load<u8>(ptr) as u32) << 24) |
    ((load<u8>(ptr + 1) as u32) << 16) |
    ((load<u8>(ptr + 2) as u32) << 8) |
    (load<u8>(ptr + 3) as u32)
  );
}

export function storeU32BE(ptr: usize, val: u32): void {
  store<u8>(ptr, <u8>(val >> 24));
  store<u8>(ptr + 1, <u8>(val >> 16));
  store<u8>(ptr + 2, <u8>(val >> 8));
  store<u8>(ptr + 3, <u8>val);
}
