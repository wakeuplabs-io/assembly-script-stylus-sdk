function getPackageName(): string {
  return "@wakeuplabs/as-stylus";
}

export function getUserEntrypointTemplate(): string {
  const packageName = getPackageName();
  return `
/* eslint-disable */

// Auto-generated contract template
import "./assembly/stylus/stylus";
import { __keep_imports } from "${packageName}/core/modules/keep-imports";
import { read_args, write_result } from "${packageName}/core/modules/hostio";
import { initHeap, malloc } from "${packageName}/core/modules/memory";
import { loadU32BE } from "${packageName}/core/modules/endianness";
import { Str } from "${packageName}/core/types/str";
import { Boolean } from "${packageName}/core/types/boolean";
import { U256 } from "${packageName}/core/types/u256";
import { Msg } from "${packageName}/core/types/msg";
import { createStorageKey } from "${packageName}/core/modules/storage";
import { storage_load_bytes32, storage_cache_bytes32, storage_flush_cache } from "${packageName}/core/modules/hostio";
import { debugLogI32 } from "${packageName}/core/modules/console";

// @logic_imports

__keep_imports(false);

const __INIT_SLOT: u64 = 999999999;

function load_initialized_storage(): usize {
  const ptr = U256.create();
  storage_load_bytes32(createStorageKey(__INIT_SLOT), ptr);
  return ptr;
}

function store_initialized_storage(ptr: usize): void {
  storage_cache_bytes32(createStorageKey(__INIT_SLOT), ptr);
  storage_flush_cache(0);
}

function isFirstTimeDeploy(): bool {
  const init = load_initialized_storage();
  debugLogI32(9000);  // Debug: checking first time deploy
  // Compare the U256 value with zero using U256.equals()
  const zero = U256.create();
  const result = U256.equals(init, zero);
  debugLogI32(result ? 9001 : 9002);  // Debug: 9001=true, 9002=false
  return result;
}

export function user_entrypoint(args_len: usize): i32 {
  const position = memory.grow(<i32>((args_len + 0xffff) >> 16));
  read_args(position);
  initHeap(position, args_len);
  const selector: u32 =
    (<u32>load<u8>(position) << 24) |
    (<u32>load<u8>(position + 1) << 16) |
    (<u32>load<u8>(position + 2) << 8) |
    (<u32>load<u8>(position + 3));

  debugLogI32(8000); // Debug: about to check first time deploy
  if (isFirstTimeDeploy()) {
    debugLogI32(8001); // Debug: is first time deploy = true
    // @constructor_check
    // @constructor_fallthrough
  } else {
    debugLogI32(8002); // Debug: is first time deploy = false
  }

  // @user_entrypoint
  return 0;
}
`;
}
