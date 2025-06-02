

# Stylus Minimal Runtime – Data Types & Inheritance  
*Last updated: 2025-06-01*

---

## 1. Built‑in Data Types

### 1.1 `U256` [Interface](./packages/as-stylus/cli/types/u256.interface.ts) | [Implementation](./packages/as-stylus/core/types/u256.ts)

#### 1.1.1 TypeScript Interface

| Method | Description | Low-Level Implementation |
|--------|-------------|---------------------------|
| **U256Factory.create()** | Creates a new empty U256 instance | Allocates 32 bytes of memory via `malloc` and returns a pointer to the zero-filled memory region |
| **U256Factory.fromString(value: string)** | Creates a U256 from a decimal string representation | Calls `setFromString` on a newly allocated 32-byte region, parsing ASCII decimal digits into the big-endian binary representation |
| **U256.add(other: U256)** | Adds another U256 to this value and returns the result | Performs in-place addition with wraparound semantics at 2²⁵⁶. Implementation uses `add(dest, src)` to modify the destination buffer directly |
| **U256.sub(other: U256)** | Subtracts another U256 from this value and returns the result | Performs in-place subtraction with wraparound semantics at 2²⁵⁶. Implementation uses `sub(dest, src)` to modify the destination buffer directly |
| **U256.toString()** | Converts the U256 value to its decimal string representation | Converts the 32-byte big-endian binary representation to ASCII decimal digits, allocating a new string buffer to hold the result |
#### 1.1.2 Low-Level Implementation

| Method | Description | Implementation Details |
|--------|-------------|-------------------------|
| **U256.create()** | Allocates memory for a new zero-filled U256 | Allocates 32 bytes via `malloc()` and fills with zeros using a loop |
| **U256.copy(dest: usize, src: usize)** | Raw 32-byte copy operation | Copies each byte individually from source to destination |
| **U256.setFromString(dest: usize, str: usize, len: u32)** | Converts decimal string to U256 | Iterates through each character, multiplies by 10 and adds the digit value |
| **U256.setFromStringHex(dest: usize, str: usize, len: u32)** | Converts hex string to U256 | Handles optional '0x' prefix, parses hex digits and builds big-endian representation |
| **U256.add(dest: usize, src: usize)** | Adds two U256 values | Performs byte-by-byte addition with carry propagation from right to left |
| **U256.sub(dest: usize, src: usize)** | Subtracts one U256 from another | Performs byte-by-byte subtraction with borrow propagation from right to left |

---

### 1.2 `Address` [Interface](./packages/as-stylus/cli/types/address.inteface.ts) | [Implementation](./packages/as-stylus/core/types/address.ts)
#### 1.2.1 Typescript interface

| Method | Description | Low-Level Implementation |
|--------|-------------|---------------------------|
| **AddressFactory.create()** | Creates a new empty Address instance | Allocates 20 bytes of memory via `malloc` and returns a pointer to the zero-filled memory region |
| **AddressFactory.fromString(hex: string)** | Creates an Address from a hexadecimal string representation | Parses the hex string into a 20-byte memory region, validating the format and handling any 0x prefix |
| **Address.clone()** | Creates a copy of this Address | Allocates a new 20-byte region and performs a byte-for-byte copy of the source address |
| **Address.toString()** | Converts the Address to its hexadecimal string representation | Converts the 20-byte binary representation to a hexadecimal string prefixed with '0x' |
| **Address.isZero()** | Checks if the Address is the zero address | Checks if all 20 bytes are zero, returns a boolean value |
| **Address.equals(other: Address)** | Compares this Address with another | Performs a byte-by-byte comparison of both addresses, returns true if identical |

#### 1.2.2 Low-Level Implementation

| Method | Description | Implementation Details |
|--------|-------------|-------------------------|
| **Address.create()** | Allocates memory for a new zero-filled Address | Allocates 20 bytes via `malloc()` and fills with zeros using a loop |
| **Address.fromBytes(ptr_20: usize)** | Creates a copy of a 20-byte buffer | Allocates new 20-byte region and copies each byte individually from source |
| **Address.equals(a: usize, b: usize)** | Compares two addresses at byte level | Uses XOR operation on all bytes to check equality, returns a single-byte boolean |
| **Address.isZero(ptr_address: usize)** | Checks if address is all zeros | Scans all 20 bytes and returns early with false if any non-zero byte found |

---

### 1.3 `String` [Implementation WIP]

#### 1.3.1 TypeScript Interface

| Method | Description | Low-Level Implementation |
|--------|-------------|---------------------------|
| **StringFactory.fromUtf8(bytes: Uint8Array)** | Creates a String from UTF-8 byte array | Wraps raw UTF-8 bytes in a String object with pointer and length |
| **StringFactory.fromString(text: string)** | Creates a String from AssemblyScript string | Converts AssemblyScript string to UTF-8 bytes and creates a String instance |
| **String.length()** | Returns the length of the string in bytes | Reads the length field from the string header struct |
| **String.toString()** | Converts to AssemblyScript string | Creates a native string representation from the UTF-8 bytes |
| **String.slice(offset: u32, length: u32)** | Creates a substring | Creates a new String pointing to a subset of the original UTF-8 data |

#### 1.3.2 Low-Level Implementation

| Method | Description | Implementation Details |
|--------|-------------|-------------------------|
| **String.fromUtf8(ptr, len)** | Creates a String from UTF-8 bytes | Returns a pointer to a header struct containing the buffer pointer and length |
| **String.length(strPtr)** | Gets the length of a string | Extracts the length field from the string header structure |
| **String.copy(dest, src)** | Copies a string | Copies both the header structure and the underlying character data |
| **String.slice(src, off, len)** | Creates a substring | Creates a new string header pointing to a subset of the original character data |

*Note: Strings are **not** stored directly in contract storage; contracts should hash or encode before storage.*

---

## 2. Contract Storage Layout and HostIO API

### 2.1 32-byte Slots

All contract storage is managed in **fixed-size 32-byte slots**, like Solidity. Each variable (Address, U256, etc.) must be **serialized** to fit this layout.

- `Address` (20 bytes) → stored at offset `12..32` in a 32B buffer (left-padded with 12 zeroes).
- `U256` (32 bytes) → stored directly.
- `Bool` (1 byte) → placed at offset 31 (optional: pack multiple bools manually).

### 2.2 Writing to Storage

To store a value:

```ts
const key = createStorageKey(slot);      // Derive 32B slot key
const data = malloc(32);                 // Allocate 32B buffer
for (let i = 0; i < 24; i++) store<u8>(data + i, 0);        // Zero padding
for (let i = 0; i < 8; i++) store<u8>(data + 31 - i, <u8>(value >> (8 * i)));
storage_cache_bytes32(key, data);       // Stage in memory
storage_flush_cache(0);                 // Commit to storage
```

### 2.3 Creating the Storage Key

Slot keys are derived from a `u64` using big-endian padding:

```ts
export function createStorageKey(slot: u64): usize {
  const key = malloc(32);
  for (let i = 0; i < 24; i++) store<u8>(key + i, 0);         // Pad 0s
  for (let i = 0; i < 8; i++) store<u8>(key + 31 - i, <u8>(slot >> (8 * i)));
  return key;
}
```

> These functions are part of the `hostio` module, which exposes Stylus-native memory ↔ storage functions.


---

## 3. ABI Interface — Arguments & Results

### 3.1 Call Envelope

| Stage | API                   | Purpose |
|-------|-----------------------|---------|
| _Loader → WASM_ | **`read_args(ptr)`** | Copies the raw calldata (selector + payload) into linear memory starting at `ptr`. |
| _User code → Host_ | **`write_result(ptr, len)`** | Returns `len` bytes from linear memory (starting at `ptr`) back to the caller. |

```text
┌────────┐           read_args            ┌─────────────┐
│  L1    │  ───────────────────────────▶  │  WASM mem.  │
└────────┘                                 └─────────────┘
┌────────┐           write_result         ┌─────────────┐
│  L1    │  ◀──────────────────────────   │  WASM mem.  │
└────────┘                                 └─────────────┘
```

### 3.2 Selector Encoding

* **4‑byte** field taken from the first four ASCII bytes of the *method name* (padded with `0x00` if shorter).  
  *Example – `get` ⇒* `0x67657400`.

The generated `entrypoint.ts` reads the first 4 bytes of calldata and performs a chain of `if (selector == 0x…) { … }`.

### 3.3 Payload Layout

After the selector, arguments are packed **tightly** in the order declared.  
Each argument is copied by `entrypoint.ts` into local variables before the business logic is executed.

### 3.4 `write_result` Size Table

| High‑level Return Type | Bytes written (`len` param) |
|------------------------|-----------------------------|
| `Address`             | **20** |
| `U256` / `I256`       | **32** |
| `bool`                | **1** |
| `string`              | Exact UTF‑8 byte length<br>*(dynamic)* |

> **Note** – `string` values are *not* stored on‑chain; they are only valid for the duration of the call. Persist user data as `bytes` or hash before writing to storage.


---
# 4. Contract Inheritance Model

### 4.1 Single‑Inheritance only
* A contract may `extends Parent` *once*.  
* Diamond / multiple inheritance **not supported**.

### 4.2 Storage layout
1. All **parent** state variables occupy the first free 32‑byte slots (`slot0…`).  
2. Child variables are laid out *immediately afterwards* — **no gaps**.  
   → Keeps storage‑layout compatibility with Solidity.

### 4.3 Method set
| Phase | Rule |
|-------|------|
| **IR generation** | Every `public` / `external` function in `Parent` is copied verbatim into the child IR. |
| **Override** | The child may redeclare a parent function **with the *exact* same signature**. In the final `selector → handler` switch the child body shadows the parent. |
| **`super`** | Not yet implemented – call the parent helper directly or duplicate logic manually. |

### 4.4 Deployment order
1. The parent’s memory layout is emitted first, followed by the child’s layout.  
2. The parent constructor runs **first**; after it returns the child constructor executes.



# 5. End‑to‑End Example – `AdminRegistry`

```ts
@Contract
class AdminRegistry /* extends Ownable */ {
  static admin: Address;

  constructor(initHex: string) {
    AdminRegistry.admin = AddressFactory.fromString(initHex);
  }

  @External setAdmin(hex: string): void {
    AdminRegistry.admin = AddressFactory.fromString(hex);
  }

  @View getAdmin(): Address {
    return AdminRegistry.admin;
  }
}
```

### 5.1 Generated low‑level code (excerpt)

```ts
// constructor
function deploy(hexPtr: usize): void {
  const addr = Address.fromBytes(hexPtr);   // ← 20‑byte copy
  storeAdmin(addr);                         // slot 0 ← addr
}

// pure getter
function getValue(): usize {
  return loadAdmin();  // returns ptr → 20‑byte buffer
}
```

### 5.2 Selector & ABI glue

| Function   | Selector | `write_result` size |
|------------|----------|---------------------|
| `deploy`   | `0x6465706c` | ‑ (no return) |
| `getAdmin` | `0x67657456` | 20 |

*In `entrypoint.ts`*:

```ts
if (selector == 0x67657456) {          // "getV" padded
  let ptr = getValue();
  write_result(ptr, 20); return 0;     // 20‑byte write
}
```

The `storeAdmin` helper packs the 20‑byte address into a full 32‑byte slot:

```ts
function storeAdmin(addr20: usize): void {
  const key  = createStorageKey(0);          // slot 0
  const data = malloc(32);                   // zero‑fill
  for (let i = 0; i < 20; ++i)
    store<u8>(data + 12 + i, load<u8>(addr20 + i));
  storage_cache_bytes32(key, data);
  storage_flush_cache(0);
}
```

---
