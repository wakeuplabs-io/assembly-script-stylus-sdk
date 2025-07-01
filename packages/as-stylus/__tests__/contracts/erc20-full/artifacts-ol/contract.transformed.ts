// eslint-disable-next-line import/namespace
import {
  storage_load_bytes32,
  storage_cache_bytes32,
  storage_flush_cache,
} from "as-stylus/core/modules/hostio";
import { createStorageKey } from "as-stylus/core/modules/storage";
import { Msg } from "as-stylus/core/types/msg";
import { addTopic, emitTopics } from "as-stylus/core/modules/events";
import { allocBool, toBool } from "as-stylus/core/types/boolean";
import { malloc } from "as-stylus/core/modules/memory";
import { Address } from "as-stylus/core/types/address";
import { U256 } from "as-stylus/core/types/u256";
import { Str } from "as-stylus/core/types/str";
import { loadU32BE } from "as-stylus/core/modules/endianness";
import { Mapping } from "as-stylus/core/types/mapping";
import { Mapping2 } from "as-stylus/core/types/mapping2";

const __SLOT00: u64 = 0;
const __SLOT01: u64 = 1;
const __SLOT02: u64 = 2;

function load_totalSupply(): usize {
  const ptr = U256.create();
  storage_load_bytes32(createStorageKey(__SLOT02), ptr);
  return ptr;
}

function store_totalSupply(ptr: usize): void {
  storage_cache_bytes32(createStorageKey(__SLOT02), ptr);
  storage_flush_cache(0);
}
const __SLOT03: u64 = 3;
function load_name(): usize {
  return Str.loadFrom(__SLOT03);
}

function store_name(strPtr: usize): void {
  Str.storeTo(__SLOT03, strPtr);
}
const __SLOT04: u64 = 4;
function load_symbol(): usize {
  return Str.loadFrom(__SLOT04);
}

function store_symbol(strPtr: usize): void {
  Str.storeTo(__SLOT04, strPtr);
}
export function __write_topic0_Transfer(dst: usize): void {
  store<u8>(dst + 0, 0xdd);
  store<u8>(dst + 1, 0xf2);
  store<u8>(dst + 2, 0x52);
  store<u8>(dst + 3, 0xad);
  store<u8>(dst + 4, 0x1b);
  store<u8>(dst + 5, 0xe2);
  store<u8>(dst + 6, 0xc8);
  store<u8>(dst + 7, 0x9b);
  store<u8>(dst + 8, 0x69);
  store<u8>(dst + 9, 0xc2);
  store<u8>(dst + 10, 0xb0);
  store<u8>(dst + 11, 0x68);
  store<u8>(dst + 12, 0xfc);
  store<u8>(dst + 13, 0x37);
  store<u8>(dst + 14, 0x8d);
  store<u8>(dst + 15, 0xaa);
  store<u8>(dst + 16, 0x95);
  store<u8>(dst + 17, 0x2b);
  store<u8>(dst + 18, 0xa7);
  store<u8>(dst + 19, 0xf1);
  store<u8>(dst + 20, 0x63);
  store<u8>(dst + 21, 0xc4);
  store<u8>(dst + 22, 0xa1);
  store<u8>(dst + 23, 0x16);
  store<u8>(dst + 24, 0x28);
  store<u8>(dst + 25, 0xf5);
  store<u8>(dst + 26, 0x5a);
  store<u8>(dst + 27, 0x4d);
  store<u8>(dst + 28, 0xf5);
  store<u8>(dst + 29, 0x23);
  store<u8>(dst + 30, 0xb3);
  store<u8>(dst + 31, 0xef);
}

export function __write_topic0_Approval(dst: usize): void {
  store<u8>(dst + 0, 0x8c);
  store<u8>(dst + 1, 0x5b);
  store<u8>(dst + 2, 0xe1);
  store<u8>(dst + 3, 0xe5);
  store<u8>(dst + 4, 0xeb);
  store<u8>(dst + 5, 0xec);
  store<u8>(dst + 6, 0x7d);
  store<u8>(dst + 7, 0x5b);
  store<u8>(dst + 8, 0xd1);
  store<u8>(dst + 9, 0x4f);
  store<u8>(dst + 10, 0x71);
  store<u8>(dst + 11, 0x42);
  store<u8>(dst + 12, 0x7d);
  store<u8>(dst + 13, 0x1e);
  store<u8>(dst + 14, 0x84);
  store<u8>(dst + 15, 0xf3);
  store<u8>(dst + 16, 0xdd);
  store<u8>(dst + 17, 0x03);
  store<u8>(dst + 18, 0x14);
  store<u8>(dst + 19, 0xc0);
  store<u8>(dst + 20, 0xf7);
  store<u8>(dst + 21, 0xb2);
  store<u8>(dst + 22, 0x29);
  store<u8>(dst + 23, 0x1e);
  store<u8>(dst + 24, 0x5b);
  store<u8>(dst + 25, 0x20);
  store<u8>(dst + 26, 0x0a);
  store<u8>(dst + 27, 0xc8);
  store<u8>(dst + 28, 0xc7);
  store<u8>(dst + 29, 0xc3);
  store<u8>(dst + 30, 0xb9);
  store<u8>(dst + 31, 0x25);
}


export function deploy(arg0: usize, arg1: usize): void {
  const _name = arg0;
  const _symbol = arg1;
  const argsStart: usize = arg0;
  const __strPtr_0: usize = _name;
  const __offsetBE_1: u32 = loadU32BE(__strPtr_0 + 28);
  const __lenPtr_2: usize = argsStart + __offsetBE_1;
  const __lenBE_3: u32 = loadU32BE(__lenPtr_2 + 28);
  const __dataPtr_4: usize = __lenPtr_2 + 32;
  const __strObj_5: usize = Str.fromBytes(__dataPtr_4, __lenBE_3);
  const nameStr = __strObj_5;
  const __strPtr_6: usize = _symbol;
  const __offsetBE_7: u32 = loadU32BE(__strPtr_6 + 28);
  const __lenPtr_8: usize = argsStart + __offsetBE_7;
  const __lenBE_9: u32 = loadU32BE(__lenPtr_8 + 28);
  const __dataPtr_10: usize = __lenPtr_8 + 32;
  const __strObj_11: usize = Str.fromBytes(__dataPtr_10, __lenBE_9);
  const symbolStr = __strObj_11;
  store_name(nameStr);
  store_symbol(symbolStr);}


export function name(): usize {
  return Str.toABI(load_name());
}

export function symbol(): usize {
  return Str.toABI(load_symbol());
}

export function decimals(): usize {
  const __hexPtr_12: usize = malloc(2);
  store<u8>(__hexPtr_12 + 0, 49);
  store<u8>(__hexPtr_12 + 1, 56);
  const __hexLen_13: u32 = 2;
  const __u256_14: usize = U256.create();
  U256.setFromString(__u256_14, __hexPtr_12, __hexLen_13);
  return __u256_14;
}

export function totalSupply(): usize {
  return load_totalSupply();
}

export function balanceOf(arg0: usize): usize {
  const account = arg0;
  return Mapping.get(__SLOT00, account);
}

export function allowance(arg0: usize, arg1: usize): usize {
  const owner = arg0;
  const spender = arg1;
  return Mapping2.get(__SLOT01, owner, spender);
}

export function transfer(arg0: usize, arg1: usize): usize {
  const to = arg0;
  const amount = arg1;
  const sender = Msg.sender();
  const senderBal = Mapping.get(__SLOT00, sender);
  if (U256.lessThan(senderBal, amount)) {
    return allocBool(false);
  }
  Mapping.set(__SLOT00, sender, U256.sub(senderBal, amount));
  const recvBal = Mapping.get(__SLOT00, to);
  Mapping.set(__SLOT00, to, U256.add(recvBal, amount));
  // topic0 for Transfer
  const __topics_15: usize = malloc(96);
  __write_topic0_Transfer(__topics_15);
  addTopic(__topics_15 + 32, sender, 32);
  addTopic(__topics_15 + 64, to, 32);
  const __data_16: usize = malloc(32);
  U256.copy(__data_16 + 0, amount);
  emitTopics(__topics_15, 3, __data_16, 32);
  return allocBool(true);
}

export function approve(arg0: usize, arg1: usize): usize {
  const spender = arg0;
  const amount = arg1;
  const owner = Msg.sender();
  Mapping2.set(__SLOT01, owner, spender, amount);
  // topic0 for Approval
  const __topics_17: usize = malloc(96);
  __write_topic0_Approval(__topics_17);
  addTopic(__topics_17 + 32, owner, 32);
  addTopic(__topics_17 + 64, spender, 32);
  const __data_18: usize = malloc(32);
  U256.copy(__data_18 + 0, amount);
  emitTopics(__topics_17, 3, __data_18, 32);
  return allocBool(true);
}

export function transferFrom(arg0: usize, arg1: usize, arg2: usize): usize {
  const from = arg0;
  const to = arg1;
  const amount = arg2;
  const spender = Msg.sender();
  const allowed = Mapping2.get(__SLOT01, from, spender);
  if (U256.lessThan(allowed, amount)) {
    return allocBool(false);
  }
  const fromBal = Mapping.get(__SLOT00, from);
  if (U256.lessThan(fromBal, amount)) {
    return allocBool(false);
  }
  const newAllowed = U256.sub(allowed, amount);
  Mapping.set(__SLOT00, from, U256.sub(fromBal, amount));
  const toBal = Mapping.get(__SLOT00, to);
  Mapping.set(__SLOT00, to, U256.add(toBal, amount));
  Mapping2.set(__SLOT01, from, spender, newAllowed);
  // topic0 for Transfer
  const __topics_19: usize = malloc(96);
  __write_topic0_Transfer(__topics_19);
  addTopic(__topics_19 + 32, from, 32);
  addTopic(__topics_19 + 64, to, 32);
  const __data_20: usize = malloc(32);
  U256.copy(__data_20 + 0, amount);
  emitTopics(__topics_19, 3, __data_20, 32);
  // topic0 for Approval
  const __topics_21: usize = malloc(96);
  __write_topic0_Approval(__topics_21);
  addTopic(__topics_21 + 32, from, 32);
  addTopic(__topics_21 + 64, spender, 32);
  const __data_22: usize = malloc(32);
  U256.copy(__data_22 + 0, newAllowed);
  emitTopics(__topics_21, 3, __data_22, 32);
  return allocBool(true);
}

export function mint(arg0: usize, arg1: usize): void {
  const to = arg0;
  const amount = arg1;
  store_totalSupply(U256.add(load_totalSupply(), amount));
  const toAmount = Mapping.get(__SLOT00, to);
  const newAmount = U256.add(toAmount, amount);
  Mapping.set(__SLOT00, to, newAmount);
  const __hexPtr_23: usize = malloc(42);
  store<u8>(__hexPtr_23 + 0, 48);
  store<u8>(__hexPtr_23 + 1, 120);
  store<u8>(__hexPtr_23 + 2, 48);
  store<u8>(__hexPtr_23 + 3, 48);
  store<u8>(__hexPtr_23 + 4, 48);
  store<u8>(__hexPtr_23 + 5, 48);
  store<u8>(__hexPtr_23 + 6, 48);
  store<u8>(__hexPtr_23 + 7, 48);
  store<u8>(__hexPtr_23 + 8, 48);
  store<u8>(__hexPtr_23 + 9, 48);
  store<u8>(__hexPtr_23 + 10, 48);
  store<u8>(__hexPtr_23 + 11, 48);
  store<u8>(__hexPtr_23 + 12, 48);
  store<u8>(__hexPtr_23 + 13, 48);
  store<u8>(__hexPtr_23 + 14, 48);
  store<u8>(__hexPtr_23 + 15, 48);
  store<u8>(__hexPtr_23 + 16, 48);
  store<u8>(__hexPtr_23 + 17, 48);
  store<u8>(__hexPtr_23 + 18, 48);
  store<u8>(__hexPtr_23 + 19, 48);
  store<u8>(__hexPtr_23 + 20, 48);
  store<u8>(__hexPtr_23 + 21, 48);
  store<u8>(__hexPtr_23 + 22, 48);
  store<u8>(__hexPtr_23 + 23, 48);
  store<u8>(__hexPtr_23 + 24, 48);
  store<u8>(__hexPtr_23 + 25, 48);
  store<u8>(__hexPtr_23 + 26, 48);
  store<u8>(__hexPtr_23 + 27, 48);
  store<u8>(__hexPtr_23 + 28, 48);
  store<u8>(__hexPtr_23 + 29, 48);
  store<u8>(__hexPtr_23 + 30, 48);
  store<u8>(__hexPtr_23 + 31, 48);
  store<u8>(__hexPtr_23 + 32, 48);
  store<u8>(__hexPtr_23 + 33, 48);
  store<u8>(__hexPtr_23 + 34, 48);
  store<u8>(__hexPtr_23 + 35, 48);
  store<u8>(__hexPtr_23 + 36, 48);
  store<u8>(__hexPtr_23 + 37, 48);
  store<u8>(__hexPtr_23 + 38, 48);
  store<u8>(__hexPtr_23 + 39, 48);
  store<u8>(__hexPtr_23 + 40, 48);
  store<u8>(__hexPtr_23 + 41, 48);
  const __hexLen_24: u32 = 42;
  const __addrPtr_25: usize = Address.create();
  Address.setFromStringHex(__addrPtr_25, __hexPtr_23, __hexLen_24);
  const AddressZero = __addrPtr_25;
  // topic0 for Transfer
  const __topics_26: usize = malloc(96);
  __write_topic0_Transfer(__topics_26);
  addTopic(__topics_26 + 32, AddressZero, 32);
  addTopic(__topics_26 + 64, to, 32);
  const __data_27: usize = malloc(32);
  U256.copy(__data_27 + 0, amount);
  emitTopics(__topics_26, 3, __data_27, 32);
}

export function burn(arg0: usize): void {
  const amount = arg0;
  const sender = Msg.sender();
  const senderBal = Mapping.get(__SLOT00, sender);
  if (U256.lessThan(senderBal, amount)) {
    return;
  }
  Mapping.set(__SLOT00, sender, U256.sub(senderBal, amount));
  store_totalSupply(U256.sub(load_totalSupply(), amount));
  const __hexPtr_28: usize = malloc(42);
  store<u8>(__hexPtr_28 + 0, 48);
  store<u8>(__hexPtr_28 + 1, 120);
  store<u8>(__hexPtr_28 + 2, 48);
  store<u8>(__hexPtr_28 + 3, 48);
  store<u8>(__hexPtr_28 + 4, 48);
  store<u8>(__hexPtr_28 + 5, 48);
  store<u8>(__hexPtr_28 + 6, 48);
  store<u8>(__hexPtr_28 + 7, 48);
  store<u8>(__hexPtr_28 + 8, 48);
  store<u8>(__hexPtr_28 + 9, 48);
  store<u8>(__hexPtr_28 + 10, 48);
  store<u8>(__hexPtr_28 + 11, 48);
  store<u8>(__hexPtr_28 + 12, 48);
  store<u8>(__hexPtr_28 + 13, 48);
  store<u8>(__hexPtr_28 + 14, 48);
  store<u8>(__hexPtr_28 + 15, 48);
  store<u8>(__hexPtr_28 + 16, 48);
  store<u8>(__hexPtr_28 + 17, 48);
  store<u8>(__hexPtr_28 + 18, 48);
  store<u8>(__hexPtr_28 + 19, 48);
  store<u8>(__hexPtr_28 + 20, 48);
  store<u8>(__hexPtr_28 + 21, 48);
  store<u8>(__hexPtr_28 + 22, 48);
  store<u8>(__hexPtr_28 + 23, 48);
  store<u8>(__hexPtr_28 + 24, 48);
  store<u8>(__hexPtr_28 + 25, 48);
  store<u8>(__hexPtr_28 + 26, 48);
  store<u8>(__hexPtr_28 + 27, 48);
  store<u8>(__hexPtr_28 + 28, 48);
  store<u8>(__hexPtr_28 + 29, 48);
  store<u8>(__hexPtr_28 + 30, 48);
  store<u8>(__hexPtr_28 + 31, 48);
  store<u8>(__hexPtr_28 + 32, 48);
  store<u8>(__hexPtr_28 + 33, 48);
  store<u8>(__hexPtr_28 + 34, 48);
  store<u8>(__hexPtr_28 + 35, 48);
  store<u8>(__hexPtr_28 + 36, 48);
  store<u8>(__hexPtr_28 + 37, 48);
  store<u8>(__hexPtr_28 + 38, 48);
  store<u8>(__hexPtr_28 + 39, 48);
  store<u8>(__hexPtr_28 + 40, 48);
  store<u8>(__hexPtr_28 + 41, 48);
  const __hexLen_29: u32 = 42;
  const __addrPtr_30: usize = Address.create();
  Address.setFromStringHex(__addrPtr_30, __hexPtr_28, __hexLen_29);
  const AddressZero = __addrPtr_30;
  // topic0 for Transfer
  const __topics_31: usize = malloc(96);
  __write_topic0_Transfer(__topics_31);
  addTopic(__topics_31 + 32, sender, 32);
  addTopic(__topics_31 + 64, AddressZero, 32);
  const __data_32: usize = malloc(32);
  U256.copy(__data_32 + 0, amount);
  emitTopics(__topics_31, 3, __data_32, 32);
}