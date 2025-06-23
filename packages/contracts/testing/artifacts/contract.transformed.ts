// eslint-disable-next-line import/namespace
import {
  storage_load_bytes32,
  storage_cache_bytes32,
  storage_flush_cache,
} from "as-stylus/core/modules/hostio";
import { createStorageKey } from "as-stylus/core/modules/storage";
import { Msg } from "as-stylus/core/types/msg";
import { allocBool } from "as-stylus/core/types/boolean";
import { addTopic, emitTopics } from "as-stylus/core/modules/events";
import { malloc } from "as-stylus/core/modules/memory";
import { Address } from "as-stylus/core/types/address";
import { U256 } from "as-stylus/core/types/u256";
import { Str } from "as-stylus/core/types/str";
import { loadU32BE } from "as-stylus/core/modules/endianness";

const __SLOT00: u64 = 0;
function load_storageVal(): usize {
  return Str.loadFrom(__SLOT00);
}

function store_storageVal(strPtr: usize): void {
  Str.storeTo(__SLOT00, strPtr);
}
export function setStorage(arg0: usize): void {
  const value = arg0;
  const argsStart: usize = arg0;
  const __strPtr_0: usize = value;
  const __offsetBE_1: u32 = loadU32BE(__strPtr_0 + 28);
  const __lenPtr_2: usize = argsStart + __offsetBE_1;
  const __lenBE_3: u32 = loadU32BE(__lenPtr_2 + 28);
  const __dataPtr_4: usize = __lenPtr_2 + 32;
  const __strObj_5: usize = Str.fromBytes(__dataPtr_4, __lenBE_3);
  const s = __strObj_5;
  store_storageVal(s);
}

export function getStorage(): usize {

  return Str.toABI(load_storageVal());
}

export function substring(arg0: usize, arg1: usize): usize {
  const offset = arg0;
  const length = arg1;
  const __offsetBE_6: u32 = loadU32BE(offset + 28);
  const __lengthBE_7: u32 = loadU32BE(length + 28);
  const __sliceRes_8: usize = Str.slice(load_storageVal(), __offsetBE_6, __lengthBE_7);
  const substring = __sliceRes_8;
  return substring;
}
