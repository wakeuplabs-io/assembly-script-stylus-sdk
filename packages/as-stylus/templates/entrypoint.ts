import fs from "fs";
import path from "path";

function getPackageName(): string {
  const cwd = process.cwd();
  const nodeModulesPath = path.join(cwd, "node_modules", "@wakeuplabs", "as-stylus");

  if (fs.existsSync(nodeModulesPath)) {
    return "@wakeuplabs/as-stylus";
  }

  return "as-stylus";
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
import { StructABI } from "${packageName}/core/abi/struct";
import { StructMemory } from "${packageName}/core/memory/struct";
import { Boolean } from "${packageName}/core/types/boolean";
import { U256 } from "${packageName}/core/types/u256";
import { createStorageKey } from "${packageName}/core/modules/storage";
import { storage_load_bytes32, storage_cache_bytes32, storage_flush_cache } from "${packageName}/core/modules/hostio";

// @logic_imports

__keep_imports(false);

const __SLOT00: u64 = 0;

function load_initialized_storage(): usize {
  const ptr = U256.create();
  storage_load_bytes32(createStorageKey(__SLOT00), ptr);
  return ptr;
}

function store_initialized_storage(ptr: usize): void {
  storage_cache_bytes32(createStorageKey(__SLOT00), ptr);
  storage_flush_cache(0);
}

function isFirstTimeDeploy(): bool {
  const init = load_initialized_storage();
  return init == 0;
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

  if (isFirstTimeDeploy()) {
    store_initialized_storage(Boolean.create(true));
    return 0;
  }

  // @user_entrypoint
  return 0;
}
`;
}
