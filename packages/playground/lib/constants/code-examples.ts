export const ERC20_CONTRACT_CODE = `// ERC-20 Token Contract
import {
  Address,
  Contract,
  Mapping,
  MappingNested,
  Str,
  U256,
  View,
  External,
  msg,
  AddressFactory,
  U256Factory,
  StrFactory,
  EventFactory,
} from"@wakeuplabs/as-stylus";

const Transfer = EventFactory.create<[from: Address, to: Address, amount: U256]>({
  indexed: [true, true, false],
});

const Approval = EventFactory.create<[owner: Address, spender: Address, amount: U256]>({
  indexed: [true, true, false],
});

@Contract
export class ERC20Full {
  balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  allowances: MappingNested<Address, Address, U256> = new MappingNested<Address, Address, U256>();
  totalSupplyValue: U256;
  nameValue: Str;
  symbolValue: Str;

  constructor(_name: string, _symbol: string) {
    const nameStr = StrFactory.fromString(_name);
    const symbolStr = StrFactory.fromString(_symbol);
    this.nameValue = nameStr;
    this.symbolValue = symbolStr;
    this.totalSupplyValue = U256Factory.fromString("0");
  }

  @View
  @External
  name(): Str {
    return this.nameValue;
  }

  @View
  @External
  symbol(): Str {
    return this.symbolValue;
  }

  @View
  @External
  decimals(): U256 {
    return U256Factory.fromString("18");
  }

  @View
  @External
  totalSupply(): U256 {
    return this.totalSupplyValue;
  }

  @View
  @External
  balanceOf(account: Address): U256 {
    return this.balances.get(account);
  }

  @View
  @External
  allowance(owner: Address, spender: Address): U256 {
    return this.allowances.get(owner, spender);
  }

  @External
  transfer(to: Address, amount: U256): boolean {
    const sender = msg.sender;
    const senderBal = this.balances.get(sender);
    if (senderBal < amount) {
      return false;
    }

    this.balances.set(sender, senderBal.sub(amount));

    const recvBal = this.balances.get(to);
    this.balances.set(to, recvBal.add(amount));

    Transfer.emit(sender, to, amount);
    return true;
  }

  @External
  approve(spender: Address, amount: U256): boolean {
    const owner = msg.sender;
    this.allowances.set(owner, spender, amount);

    Approval.emit(owner, spender, amount);
    return true;
  }

  @External
  transferFrom(from: Address, to: Address, amount: U256): boolean {
    const spender = msg.sender;
    const allowed = this.allowances.get(from, spender);
    if (allowed < amount) {
      return false;
    }

    const fromBal = this.balances.get(from);
    if (fromBal < amount) {
      return false;
    }
    const newAllowed = allowed.sub(amount);
    this.balances.set(from, fromBal.sub(amount));
    const toBal = this.balances.get(to);
    this.balances.set(to, toBal.add(amount));

    this.allowances.set(from, spender, newAllowed);

    Transfer.emit(from, to, amount);
    Approval.emit(from, spender, newAllowed);
    return true;
  }

  @External
  mint(to: Address, amount: U256): void {
    this.totalSupplyValue = this.totalSupplyValue.add(amount);
    const toAmount = this.balances.get(to);
    const newAmount = toAmount.add(amount);
    this.balances.set(to, newAmount);
    const AddressZero = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    Transfer.emit(AddressZero, to, amount);
  }

  @External
  burn(amount: U256): void {
    const sender = msg.sender;
    const senderBal = this.balances.get(sender);
    if (senderBal < amount) {
      return;
    }
    this.balances.set(sender, senderBal.sub(amount));
    this.totalSupplyValue = this.totalSupplyValue.sub(amount);
    const AddressZero = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    Transfer.emit(sender, AddressZero, amount);
  }
}`;

export const ERC20_ENTRYPOINT_CODE = `// ERC-20 Entrypoint
// Auto-generated contract template
import "./assembly/stylus/stylus";
import {
  read_args,
  write_result,
  storage_load_bytes32,
  storage_cache_bytes32,
  storage_flush_cache,
} from "@wakeuplabs/as-stylus/core/modules/hostio";
import { __keep_imports } from "@wakeuplabs/as-stylus/core/modules/keep-imports";
import { initHeap } from "@wakeuplabs/as-stylus/core/modules/memory";
import { createStorageKey } from "@wakeuplabs/as-stylus/core/modules/storage";
import { Boolean } from "@wakeuplabs/as-stylus/core/types/boolean";
import { Str } from "@wakeuplabs/as-stylus/core/types/str";
import { U256 } from "@wakeuplabs/as-stylus/core/types/u256";

import {
  name,
  symbol,
  decimals,
  totalSupply,
  balanceOf,
  allowance,
  transfer,
  approve,
  transferFrom,
  mint,
  burn,
  contract_constructor,
} from "./contract.transformed";

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
  // Compare the U256 value with zero using U256.equals()
  const zero = U256.create();
  const result = U256.equals(init, zero);
  return result;
}

export function user_entrypoint(args_len: usize): i32 {
  const position = memory.grow(<i32>((args_len + 0xffff) >> 16));
  read_args(position);
  initHeap(position, args_len);
  const selector: u32 =
    ((<u32>load<u8>(position)) << 24) |
    ((<u32>load<u8>(position + 1)) << 16) |
    ((<u32>load<u8>(position + 2)) << 8) |
    (<u32>load<u8>(position + 3));

  if (isFirstTimeDeploy()) {
    if (selector == 0x71742007) {
      const arg0 = Str.fromDynamicArg(position + 4, position + 4);
      const arg1 = Str.fromDynamicArg(position + 4, position + 36);
      contract_constructor(arg0, arg1);
      store_initialized_storage(Boolean.create(true));
      return 0;
    }
  }

  if (selector == 0x06fdde03) {
    const buf = Str.toABI(name());
    const size = Str.getABISize(buf);
    write_result(buf, size);
    return 0;
  }
  if (selector == 0x95d89b41) {
    const buf = Str.toABI(symbol());
    const size = Str.getABISize(buf);
    write_result(buf, size);
    return 0;
  }
  if (selector == 0x313ce567) {
    const ptr = decimals();
    write_result(ptr, 32);
    return 0;
  }
  if (selector == 0x18160ddd) {
    const ptr = totalSupply();
    write_result(ptr, 32);
    return 0;
  }
  if (selector == 0x70a08231) {
    const arg0 = position + 4;
    const ptr = balanceOf(arg0);
    write_result(ptr, 32);
    return 0;
  }
  if (selector == 0xdd62ed3e) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    const ptr = allowance(arg0, arg1);
    write_result(ptr, 32);
    return 0;
  }
  if (selector == 0xa9059cbb) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    const ptr = Boolean.create(transfer(arg0, arg1));
    write_result(ptr, 32);
    return 0;
  }
  if (selector == 0x095ea7b3) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    const ptr = Boolean.create(approve(arg0, arg1));
    write_result(ptr, 32);
    return 0;
  }
  if (selector == 0x23b872dd) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    const arg2 = position + 68;
    const ptr = Boolean.create(transferFrom(arg0, arg1, arg2));
    write_result(ptr, 32);
    return 0;
  }
  if (selector == 0x40c10f19) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    mint(arg0, arg1);
    return 0;
  }
  if (selector == 0x42966c68) {
    const arg0 = position + 4;
    burn(arg0);
    return 0;
  }
  return 0;
}
`;

export const ERC20_CONTRACT_TRANSFORMED = `// ERC-20 Token Contract Transformed
import { addTopic, emitTopics } from "@wakeuplabs/as-stylus/core/modules/events";
import {
  storage_load_bytes32,
  storage_cache_bytes32,
  storage_flush_cache,
} from "@wakeuplabs/as-stylus/core/modules/hostio";
import { malloc } from "@wakeuplabs/as-stylus/core/modules/memory";
import { createStorageKey } from "@wakeuplabs/as-stylus/core/modules/storage";
import { Address } from "@wakeuplabs/as-stylus/core/types/address";
import { Mapping } from "@wakeuplabs/as-stylus/core/types/mapping";
import { MappingNested } from "@wakeuplabs/as-stylus/core/types/mapping2";
import { Msg } from "@wakeuplabs/as-stylus/core/types/msg";
import { Str } from "@wakeuplabs/as-stylus/core/types/str";
import { U256 } from "@wakeuplabs/as-stylus/core/types/u256";

const __SLOT00: u64 = 0;
const __SLOT01: u64 = 1;
const __SLOT02: u64 = 2;
const __SLOT03: u64 = 3;
const __SLOT04: u64 = 4;

function load_totalSupplyValue(): usize {
  const ptr = U256.create();
  storage_load_bytes32(createStorageKey(__SLOT02), ptr);
  return ptr;
}

function store_totalSupplyValue(ptr: usize): void {
  storage_cache_bytes32(createStorageKey(__SLOT02), ptr);
  storage_flush_cache(0);
}
function load_nameValue(): usize {
  return Str.loadFrom(__SLOT03);
}

function store_nameValue(ptr: usize): void {
  Str.storeTo(__SLOT03, ptr);
}
function load_symbolValue(): usize {
  return Str.loadFrom(__SLOT04);
}

function store_symbolValue(ptr: usize): void {
  Str.storeTo(__SLOT04, ptr);
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

export function contract_constructor(arg0: usize, arg1: usize): void {
  const _name = arg0;
  const _symbol = arg1;
  const __strObj_0: usize = _name;
  const nameStr = __strObj_0;
  const __strObj_1: usize = _symbol;
  const symbolStr = __strObj_1;
  store_nameValue(nameStr);
  store_symbolValue(symbolStr);
  const __str_2: usize = malloc(1);
  store<u8>(__str_2 + 0, 48);
  const __len_3: u32 = 1;
  store_totalSupplyValue(U256.fromString(__str_2, __len_3));
}

export function name(): usize {
  return load_nameValue();
}
export function symbol(): usize {
  return load_symbolValue();
}
export function decimals(): usize {
  const __str_4: usize = malloc(2);
  store<u8>(__str_4 + 0, 49);
  store<u8>(__str_4 + 1, 56);
  const __len_5: u32 = 2;
  return U256.fromString(__str_4, __len_5);
}
export function totalSupply(): usize {
  return load_totalSupplyValue();
}
export function balanceOf(arg0: usize): usize {
  const account = arg0;
  return Mapping.getU256(__SLOT00, account);
}
export function allowance(arg0: usize, arg1: usize): usize {
  const owner = arg0;
  const spender = arg1;
  return MappingNested.getU256(__SLOT01, owner, spender);
}
export function transfer(arg0: usize, arg1: usize): boolean {
  const to = arg0;
  const amount = arg1;
  const sender = Msg.sender();
  const senderBal = Mapping.getU256(__SLOT00, sender);
  if (U256.lessThan(senderBal, amount)) {
    return false;
  }
  Mapping.setU256(__SLOT00, sender, U256.sub(senderBal, amount));
  const recvBal = Mapping.getU256(__SLOT00, to);
  Mapping.setU256(__SLOT00, to, U256.add(recvBal, amount));
  // topic0 for Transfer
  const __topics_6: usize = malloc(96);
  __write_topic0_Transfer(__topics_6);
  addTopic(__topics_6 + 32, sender, 32);
  addTopic(__topics_6 + 64, to, 32);
  const __data_7: usize = malloc(32);
  U256.copyInPlace(__data_7 + 0, amount);
  emitTopics(__topics_6, 3, __data_7, 32);
  return true;
}
export function approve(arg0: usize, arg1: usize): boolean {
  const spender = arg0;
  const amount = arg1;
  const owner = Msg.sender();
  MappingNested.setU256(__SLOT01, owner, spender, amount);
  // topic0 for Approval
  const __topics_8: usize = malloc(96);
  __write_topic0_Approval(__topics_8);
  addTopic(__topics_8 + 32, owner, 32);
  addTopic(__topics_8 + 64, spender, 32);
  const __data_9: usize = malloc(32);
  U256.copyInPlace(__data_9 + 0, amount);
  emitTopics(__topics_8, 3, __data_9, 32);
  return true;
}
export function transferFrom(arg0: usize, arg1: usize, arg2: usize): boolean {
  const from = arg0;
  const to = arg1;
  const amount = arg2;
  const spender = Msg.sender();
  const allowed = MappingNested.getU256(__SLOT01, from, spender);
  if (U256.lessThan(allowed, amount)) {
    return false;
  }
  const fromBal = Mapping.getU256(__SLOT00, from);
  if (U256.lessThan(fromBal, amount)) {
    return false;
  }
  const newAllowed = U256.sub(allowed, amount);
  Mapping.setU256(__SLOT00, from, U256.sub(fromBal, amount));
  const toBal = Mapping.getU256(__SLOT00, to);
  Mapping.setU256(__SLOT00, to, U256.add(toBal, amount));
  MappingNested.setU256(__SLOT01, from, spender, newAllowed);
  // topic0 for Transfer
  const __topics_10: usize = malloc(96);
  __write_topic0_Transfer(__topics_10);
  addTopic(__topics_10 + 32, from, 32);
  addTopic(__topics_10 + 64, to, 32);
  const __data_11: usize = malloc(32);
  U256.copyInPlace(__data_11 + 0, amount);
  emitTopics(__topics_10, 3, __data_11, 32);
  // topic0 for Approval
  const __topics_12: usize = malloc(96);
  __write_topic0_Approval(__topics_12);
  addTopic(__topics_12 + 32, from, 32);
  addTopic(__topics_12 + 64, spender, 32);
  const __data_13: usize = malloc(32);
  U256.copyInPlace(__data_13 + 0, newAllowed);
  emitTopics(__topics_12, 3, __data_13, 32);
  return true;
}
export function mint(arg0: usize, arg1: usize): void {
  const to = arg0;
  const amount = arg1;
  store_totalSupplyValue(U256.add(load_totalSupplyValue(), amount));
  const toAmount = Mapping.getU256(__SLOT00, to);
  const newAmount = U256.add(toAmount, amount);
  Mapping.setU256(__SLOT00, to, newAmount);
  const __hexPtr_14: usize = malloc(42);
  store<u8>(__hexPtr_14 + 0, 48);
  store<u8>(__hexPtr_14 + 1, 120);
  store<u8>(__hexPtr_14 + 2, 48);
  store<u8>(__hexPtr_14 + 3, 48);
  store<u8>(__hexPtr_14 + 4, 48);
  store<u8>(__hexPtr_14 + 5, 48);
  store<u8>(__hexPtr_14 + 6, 48);
  store<u8>(__hexPtr_14 + 7, 48);
  store<u8>(__hexPtr_14 + 8, 48);
  store<u8>(__hexPtr_14 + 9, 48);
  store<u8>(__hexPtr_14 + 10, 48);
  store<u8>(__hexPtr_14 + 11, 48);
  store<u8>(__hexPtr_14 + 12, 48);
  store<u8>(__hexPtr_14 + 13, 48);
  store<u8>(__hexPtr_14 + 14, 48);
  store<u8>(__hexPtr_14 + 15, 48);
  store<u8>(__hexPtr_14 + 16, 48);
  store<u8>(__hexPtr_14 + 17, 48);
  store<u8>(__hexPtr_14 + 18, 48);
  store<u8>(__hexPtr_14 + 19, 48);
  store<u8>(__hexPtr_14 + 20, 48);
  store<u8>(__hexPtr_14 + 21, 48);
  store<u8>(__hexPtr_14 + 22, 48);
  store<u8>(__hexPtr_14 + 23, 48);
  store<u8>(__hexPtr_14 + 24, 48);
  store<u8>(__hexPtr_14 + 25, 48);
  store<u8>(__hexPtr_14 + 26, 48);
  store<u8>(__hexPtr_14 + 27, 48);
  store<u8>(__hexPtr_14 + 28, 48);
  store<u8>(__hexPtr_14 + 29, 48);
  store<u8>(__hexPtr_14 + 30, 48);
  store<u8>(__hexPtr_14 + 31, 48);
  store<u8>(__hexPtr_14 + 32, 48);
  store<u8>(__hexPtr_14 + 33, 48);
  store<u8>(__hexPtr_14 + 34, 48);
  store<u8>(__hexPtr_14 + 35, 48);
  store<u8>(__hexPtr_14 + 36, 48);
  store<u8>(__hexPtr_14 + 37, 48);
  store<u8>(__hexPtr_14 + 38, 48);
  store<u8>(__hexPtr_14 + 39, 48);
  store<u8>(__hexPtr_14 + 40, 48);
  store<u8>(__hexPtr_14 + 41, 48);
  const __hexLen_15: u32 = 42;
  const __addrPtr_16: usize = Address.create();
  Address.setFromStringHex(__addrPtr_16, __hexPtr_14, __hexLen_15);
  const AddressZero = __addrPtr_16;
  // topic0 for Transfer
  const __topics_17: usize = malloc(96);
  __write_topic0_Transfer(__topics_17);
  addTopic(__topics_17 + 32, AddressZero, 32);
  addTopic(__topics_17 + 64, to, 32);
  const __data_18: usize = malloc(32);
  U256.copyInPlace(__data_18 + 0, amount);
  emitTopics(__topics_17, 3, __data_18, 32);
}
export function burn(arg0: usize): void {
  const amount = arg0;
  const sender = Msg.sender();
  const senderBal = Mapping.getU256(__SLOT00, sender);
  if (U256.lessThan(senderBal, amount)) {
    return;
  }
  Mapping.setU256(__SLOT00, sender, U256.sub(senderBal, amount));
  store_totalSupplyValue(U256.sub(load_totalSupplyValue(), amount));
  const __hexPtr_19: usize = malloc(42);
  store<u8>(__hexPtr_19 + 0, 48);
  store<u8>(__hexPtr_19 + 1, 120);
  store<u8>(__hexPtr_19 + 2, 48);
  store<u8>(__hexPtr_19 + 3, 48);
  store<u8>(__hexPtr_19 + 4, 48);
  store<u8>(__hexPtr_19 + 5, 48);
  store<u8>(__hexPtr_19 + 6, 48);
  store<u8>(__hexPtr_19 + 7, 48);
  store<u8>(__hexPtr_19 + 8, 48);
  store<u8>(__hexPtr_19 + 9, 48);
  store<u8>(__hexPtr_19 + 10, 48);
  store<u8>(__hexPtr_19 + 11, 48);
  store<u8>(__hexPtr_19 + 12, 48);
  store<u8>(__hexPtr_19 + 13, 48);
  store<u8>(__hexPtr_19 + 14, 48);
  store<u8>(__hexPtr_19 + 15, 48);
  store<u8>(__hexPtr_19 + 16, 48);
  store<u8>(__hexPtr_19 + 17, 48);
  store<u8>(__hexPtr_19 + 18, 48);
  store<u8>(__hexPtr_19 + 19, 48);
  store<u8>(__hexPtr_19 + 20, 48);
  store<u8>(__hexPtr_19 + 21, 48);
  store<u8>(__hexPtr_19 + 22, 48);
  store<u8>(__hexPtr_19 + 23, 48);
  store<u8>(__hexPtr_19 + 24, 48);
  store<u8>(__hexPtr_19 + 25, 48);
  store<u8>(__hexPtr_19 + 26, 48);
  store<u8>(__hexPtr_19 + 27, 48);
  store<u8>(__hexPtr_19 + 28, 48);
  store<u8>(__hexPtr_19 + 29, 48);
  store<u8>(__hexPtr_19 + 30, 48);
  store<u8>(__hexPtr_19 + 31, 48);
  store<u8>(__hexPtr_19 + 32, 48);
  store<u8>(__hexPtr_19 + 33, 48);
  store<u8>(__hexPtr_19 + 34, 48);
  store<u8>(__hexPtr_19 + 35, 48);
  store<u8>(__hexPtr_19 + 36, 48);
  store<u8>(__hexPtr_19 + 37, 48);
  store<u8>(__hexPtr_19 + 38, 48);
  store<u8>(__hexPtr_19 + 39, 48);
  store<u8>(__hexPtr_19 + 40, 48);
  store<u8>(__hexPtr_19 + 41, 48);
  const __hexLen_20: u32 = 42;
  const __addrPtr_21: usize = Address.create();
  Address.setFromStringHex(__addrPtr_21, __hexPtr_19, __hexLen_20);
  const AddressZero = __addrPtr_21;
  // topic0 for Transfer
  const __topics_22: usize = malloc(96);
  __write_topic0_Transfer(__topics_22);
  addTopic(__topics_22 + 32, sender, 32);
  addTopic(__topics_22 + 64, AddressZero, 32);
  const __data_23: usize = malloc(32);
  U256.copyInPlace(__data_23 + 0, amount);
  emitTopics(__topics_22, 3, __data_23, 32);
}
`;

export const ERC721_CONTRACT_CODE = `// ERC-721 NFT Contract
import {
  Contract,
  External,
  U256,
  U256Factory,
  Address,
  Mapping,
  MappingNested,
  View,
  ErrorFactory,
  Str,
  StrFactory,
  msg,
  AddressFactory,
  EventFactory,
} from "@wakeuplabs/as-stylus";

const ERC721InvalidOwner = ErrorFactory.create<[owner: Address]>();
const ERC721NonexistentToken = ErrorFactory.create<[tokenId: U256]>();
const ERC721IncorrectOwner =
  ErrorFactory.create<[sender: Address, tokenId: U256, owner: Address]>();
const ERC721InvalidReceiver = ErrorFactory.create<[receiver: Address]>();
const ERC721InsufficientApproval = ErrorFactory.create<[sender: Address, tokenId: U256]>();
const ERC721InvalidApprover = ErrorFactory.create<[approver: Address]>();
const ERC721InvalidOperator = ErrorFactory.create<[operator: Address]>();
const ERC721InvalidSender = ErrorFactory.create<[sender: Address]>();

const Transfer = EventFactory.create<[from: Address, to: Address, tokenId: U256]>({
  indexed: [true, true, true],
});

const Approval = EventFactory.create<[owner: Address, spender: Address, tokenId: U256]>({
  indexed: [true, true, true],
});

const ApprovalForAll = EventFactory.create<[owner: Address, operator: Address, approved: boolean]>({
  indexed: [true, true, false],
});

@Contract
export class ERC721 {
  owners: Mapping<U256, Address> = new Mapping<U256, Address>();
  balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  tokenApprovals: Mapping<U256, Address> = new Mapping<U256, Address>();
  operatorApprovals: MappingNested<Address, Address, boolean> = new MappingNested<
    Address,
    Address,
    boolean
  >();
  nameValue: Str;
  symbolValue: Str;

  constructor(_name: string, _symbol: string) {
    const nameStr = StrFactory.fromString(_name);
    const symbolStr = StrFactory.fromString(_symbol);
    this.nameValue = nameStr;
    this.symbolValue = symbolStr;
  }

  @External
  approve(to: Address, tokenId: U256): void {
    const authorizer = msg.sender;

    const owner = this.owners.get(tokenId);
    const isOwnerZero = owner.isZero();
    if (isOwnerZero) {
      ERC721NonexistentToken.revert(tokenId);
    }

    const isOwnerAuth = owner.equals(authorizer);
    const isApprovedForAll = this.operatorApprovals.get(owner, authorizer);
    const isAuthorized = isOwnerAuth || isApprovedForAll;
    if (!isAuthorized) {
      ERC721InvalidApprover.revert(authorizer);
    }
    this.tokenApprovals.set(tokenId, to);
    Approval.emit(owner, to, tokenId);
  }

  @External
  setApprovalForAll(operator: Address, approved: boolean): void {
    const isOperatorZero = operator.isZero();
    if (isOperatorZero) {
      ERC721InvalidOperator.revert(operator);
    }
    const owner = msg.sender;
    this.operatorApprovals.set(owner, operator, approved);
    ApprovalForAll.emit(owner, operator, approved);
  }

  @External
  transferFrom(from: Address, to: Address, tokenId: U256): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");

    // transferFrom validations
    const isToZero = to.isZero();
    if (isToZero) {
      ERC721InvalidReceiver.revert(to);
    }

    const owner = this.owners.get(tokenId);
    const authorizer = msg.sender;

    const isOwnerZero = owner.isZero();
    const approvedAddress = this.tokenApprovals.get(tokenId);
    const isApprovedForAll = this.operatorApprovals.get(owner, authorizer);
    const isAuthOwner = authorizer.equals(owner);
    const isAuthApproved = authorizer.equals(approvedAddress);
    const isAuthorized = isAuthOwner || isAuthApproved || isApprovedForAll;

    if (!isAuthorized) {
      if (isOwnerZero) {
        ERC721NonexistentToken.revert(tokenId);
      } else {
        ERC721InsufficientApproval.revert(authorizer, tokenId);
      }
    }

    const isFromOwner = owner.equals(from);
    if (!isFromOwner) {
      ERC721IncorrectOwner.revert(authorizer, tokenId, owner);
    }

    const isFromZero = owner.isZero();
    if (!isFromZero) {
      this.tokenApprovals.set(tokenId, zeroAddress);
      const fromBalance: U256 = this.balances.get(owner);
      this.balances.set(owner, fromBalance.sub(U256Factory.fromString("1")));
    }

    if (!isToZero) {
      const toBalance: U256 = this.balances.get(to);
      this.balances.set(to, toBalance.add(U256Factory.fromString("1")));
    }

    this.owners.set(tokenId, to);
    Transfer.emit(owner, to, tokenId);
  }

  @External
  mint(to: Address, tokenId: U256): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");

    const isToZero = to.isZero();
    if (isToZero) {
      ERC721InvalidReceiver.revert(zeroAddress);
    }

    const from = this.owners.get(tokenId);

    const isFromZero = from.isZero();
    if (!isFromZero) {
      ERC721InvalidSender.revert(zeroAddress);
    }

    if (!isToZero) {
      const toBalance = this.balances.get(to);
      this.balances.set(to, toBalance.add(U256Factory.fromString("1")));
    }

    this.owners.set(tokenId, to);
    Transfer.emit(from, to, tokenId);
  }

  @External
  burn(tokenId: U256): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");

    const from = this.owners.get(tokenId);

    const isFromZero = from.isZero();
    if (!isFromZero) {
      this.tokenApprovals.set(tokenId, zeroAddress);
      const fromBalance = this.balances.get(from);
      this.balances.set(from, fromBalance.sub(U256Factory.fromString("1")));
    }

    this.owners.set(tokenId, zeroAddress);
    Transfer.emit(from, zeroAddress, tokenId);

    if (isFromZero) {
      ERC721NonexistentToken.revert(tokenId);
    }
  }

  @View
  balanceOf(owner: Address): U256 {
    const isOwnerZero = owner.isZero();
    if (isOwnerZero) {
      ERC721InvalidOwner.revert(owner);
    }
    return this.balances.get(owner);
  }

  @View
  ownerOf(tokenId: U256): Address {
    const owner = this.owners.get(tokenId);
    const isZero = this.owners.get(tokenId).isZero();
    if (isZero) ERC721NonexistentToken.revert(tokenId);
    return owner;
  }

  @View
  name(): Str {
    return this.nameValue;
  }

  @View
  symbol(): Str {
    return this.symbolValue;
  }

  @View
  getApproved(tokenId: U256): Address {
    const owner = this.owners.get(tokenId);
    const isZero = owner.isZero();
    if (isZero) ERC721NonexistentToken.revert(tokenId);
    return this.tokenApprovals.get(tokenId);
  }

  @View
  isApprovedForAll(owner: Address, operator: Address): boolean {
    return this.operatorApprovals.get(owner, operator);
  }
}
`;

export const ERC721_ENTRYPOINT_CODE = `// ERC-721 Entrypoint
// Auto-generated contract template
import "./assembly/stylus/stylus";
import {
  read_args,
  write_result,
  storage_load_bytes32,
  storage_cache_bytes32,
  storage_flush_cache,
} from "@wakeuplabs/as-stylus/core/modules/hostio";
import { __keep_imports } from "@wakeuplabs/as-stylus/core/modules/keep-imports";
import { initHeap } from "@wakeuplabs/as-stylus/core/modules/memory";
import { createStorageKey } from "@wakeuplabs/as-stylus/core/modules/storage";
import { Boolean } from "@wakeuplabs/as-stylus/core/types/boolean";
import { Str } from "@wakeuplabs/as-stylus/core/types/str";
import { U256 } from "@wakeuplabs/as-stylus/core/types/u256";

import {
  approve,
  setApprovalForAll,
  transferFrom,
  mint,
  burn,
  balanceOf,
  ownerOf,
  name,
  symbol,
  getApproved,
  isApprovedForAll,
  contract_constructor,
} from "./contract.transformed";

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
  // Compare the U256 value with zero using U256.equals()
  const zero = U256.create();
  const result = U256.equals(init, zero);
  return result;
}

export function user_entrypoint(args_len: usize): i32 {
  const position = memory.grow(<i32>((args_len + 0xffff) >> 16));
  read_args(position);
  initHeap(position, args_len);
  const selector: u32 =
    ((<u32>load<u8>(position)) << 24) |
    ((<u32>load<u8>(position + 1)) << 16) |
    ((<u32>load<u8>(position + 2)) << 8) |
    (<u32>load<u8>(position + 3));

  if (isFirstTimeDeploy()) {
    if (selector == 0x71742007) {
      const arg0 = Str.fromDynamicArg(position + 4, position + 4);
      const arg1 = Str.fromDynamicArg(position + 4, position + 36);
      contract_constructor(arg0, arg1);
      store_initialized_storage(Boolean.create(true));
      return 0;
    }
  }

  if (selector == 0x095ea7b3) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    approve(arg0, arg1);
    return 0;
  }
  if (selector == 0xa22cb465) {
    const arg0 = position + 4;
    const arg1 = Boolean.fromABI(position + 36);
    setApprovalForAll(arg0, arg1);
    return 0;
  }
  if (selector == 0x23b872dd) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    const arg2 = position + 68;
    transferFrom(arg0, arg1, arg2);
    return 0;
  }
  if (selector == 0x40c10f19) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    mint(arg0, arg1);
    return 0;
  }
  if (selector == 0x42966c68) {
    const arg0 = position + 4;
    burn(arg0);
    return 0;
  }
  if (selector == 0x70a08231) {
    const arg0 = position + 4;
    const ptr = balanceOf(arg0);
    write_result(ptr, 32);
    return 0;
  }
  if (selector == 0x6352211e) {
    const arg0 = position + 4;
    const ptr = ownerOf(arg0);
    write_result(ptr, 32);
    return 0;
  }
  if (selector == 0x06fdde03) {
    const buf = Str.toABI(name());
    const size = Str.getABISize(buf);
    write_result(buf, size);
    return 0;
  }
  if (selector == 0x95d89b41) {
    const buf = Str.toABI(symbol());
    const size = Str.getABISize(buf);
    write_result(buf, size);
    return 0;
  }
  if (selector == 0x081812fc) {
    const arg0 = position + 4;
    const ptr = getApproved(arg0);
    write_result(ptr, 32);
    return 0;
  }
  if (selector == 0xe985e9c5) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    const ptr = Boolean.create(isApprovedForAll(arg0, arg1));
    write_result(ptr, 32);
    return 0;
  }
  return 0;
}
`;

export const ERC721_CONTRACT_TRANSFORMED = `// ERC-721 NFT Contract Transformed
import { abort_with_data } from "@wakeuplabs/as-stylus/core/modules/errors";
import { addTopic, emitTopics } from "@wakeuplabs/as-stylus/core/modules/events";
import { malloc } from "@wakeuplabs/as-stylus/core/modules/memory";
import { Address } from "@wakeuplabs/as-stylus/core/types/address";
import { Boolean } from "@wakeuplabs/as-stylus/core/types/boolean";
import { Mapping } from "@wakeuplabs/as-stylus/core/types/mapping";
import { MappingNested } from "@wakeuplabs/as-stylus/core/types/mapping2";
import { Msg } from "@wakeuplabs/as-stylus/core/types/msg";
import { Str } from "@wakeuplabs/as-stylus/core/types/str";
import { U256 } from "@wakeuplabs/as-stylus/core/types/u256";

const __SLOT00: u64 = 0;
const __SLOT01: u64 = 1;
const __SLOT02: u64 = 2;
const __SLOT03: u64 = 3;
const __SLOT04: u64 = 4;
const __SLOT05: u64 = 5;

function load_nameValue(): usize {
  return Str.loadFrom(__SLOT04);
}

function store_nameValue(ptr: usize): void {
  Str.storeTo(__SLOT04, ptr);
}
function load_symbolValue(): usize {
  return Str.loadFrom(__SLOT05);
}

function store_symbolValue(ptr: usize): void {
  Str.storeTo(__SLOT05, ptr);
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

export function __write_topic0_ApprovalForAll(dst: usize): void {
  store<u8>(dst + 0, 0x17);
  store<u8>(dst + 1, 0x30);
  store<u8>(dst + 2, 0x7e);
  store<u8>(dst + 3, 0xab);
  store<u8>(dst + 4, 0x39);
  store<u8>(dst + 5, 0xab);
  store<u8>(dst + 6, 0x61);
  store<u8>(dst + 7, 0x07);
  store<u8>(dst + 8, 0xe8);
  store<u8>(dst + 9, 0x89);
  store<u8>(dst + 10, 0x98);
  store<u8>(dst + 11, 0x45);
  store<u8>(dst + 12, 0xad);
  store<u8>(dst + 13, 0x3d);
  store<u8>(dst + 14, 0x59);
  store<u8>(dst + 15, 0xbd);
  store<u8>(dst + 16, 0x96);
  store<u8>(dst + 17, 0x53);
  store<u8>(dst + 18, 0xf2);
  store<u8>(dst + 19, 0x00);
  store<u8>(dst + 20, 0xf2);
  store<u8>(dst + 21, 0x20);
  store<u8>(dst + 22, 0x92);
  store<u8>(dst + 23, 0x04);
  store<u8>(dst + 24, 0x89);
  store<u8>(dst + 25, 0xca);
  store<u8>(dst + 26, 0x2b);
  store<u8>(dst + 27, 0x59);
  store<u8>(dst + 28, 0x37);
  store<u8>(dst + 29, 0x69);
  store<u8>(dst + 30, 0x6c);
  store<u8>(dst + 31, 0x31);
}

// Error: ERC721InvalidOwner
// Selector: 0x89c62b64
// Signature: ERC721InvalidOwner(address)
export function __write_error_selector_ERC721InvalidOwner(dst: usize): void {
  store<u8>(dst + 0, 0x89);
  store<u8>(dst + 1, 0xc6);
  store<u8>(dst + 2, 0x2b);
  store<u8>(dst + 3, 0x64);
}

export function __create_error_data_ERC721InvalidOwner(arg0: usize): usize {
  const errorData: usize = malloc(36);
  __write_error_selector_ERC721InvalidOwner(errorData); // Write selector
  // Write argument 1: arg0 (address)
  U256.copyInPlace(errorData + 4, arg0);
  return errorData;
}

// Error: ERC721NonexistentToken
// Selector: 0x7e273289
// Signature: ERC721NonexistentToken(uint256)
export function __write_error_selector_ERC721NonexistentToken(dst: usize): void {
  store<u8>(dst + 0, 0x7e);
  store<u8>(dst + 1, 0x27);
  store<u8>(dst + 2, 0x32);
  store<u8>(dst + 3, 0x89);
}

export function __create_error_data_ERC721NonexistentToken(arg0: usize): usize {
  const errorData: usize = malloc(36);
  __write_error_selector_ERC721NonexistentToken(errorData); // Write selector
  // Write argument 1: arg0 (uint256)
  U256.copyInPlace(errorData + 4, arg0);
  return errorData;
}

// Error: ERC721IncorrectOwner
// Selector: 0x64283d7b
// Signature: ERC721IncorrectOwner(address,uint256,address)
export function __write_error_selector_ERC721IncorrectOwner(dst: usize): void {
  store<u8>(dst + 0, 0x64);
  store<u8>(dst + 1, 0x28);
  store<u8>(dst + 2, 0x3d);
  store<u8>(dst + 3, 0x7b);
}

export function __create_error_data_ERC721IncorrectOwner(
  arg0: usize,
  arg1: usize,
  arg2: usize,
): usize {
  const errorData: usize = malloc(100);
  __write_error_selector_ERC721IncorrectOwner(errorData); // Write selector
  // Write argument 1: arg0 (address)
  U256.copyInPlace(errorData + 4, arg0);
  // Write argument 2: arg1 (uint256)
  U256.copyInPlace(errorData + 36, arg1);
  // Write argument 3: arg2 (address)
  U256.copyInPlace(errorData + 68, arg2);
  return errorData;
}

// Error: ERC721InvalidReceiver
// Selector: 0x64a0ae92
// Signature: ERC721InvalidReceiver(address)
export function __write_error_selector_ERC721InvalidReceiver(dst: usize): void {
  store<u8>(dst + 0, 0x64);
  store<u8>(dst + 1, 0xa0);
  store<u8>(dst + 2, 0xae);
  store<u8>(dst + 3, 0x92);
}

export function __create_error_data_ERC721InvalidReceiver(arg0: usize): usize {
  const errorData: usize = malloc(36);
  __write_error_selector_ERC721InvalidReceiver(errorData); // Write selector
  // Write argument 1: arg0 (address)
  U256.copyInPlace(errorData + 4, arg0);
  return errorData;
}

// Error: ERC721InsufficientApproval
// Selector: 0x177e802f
// Signature: ERC721InsufficientApproval(address,uint256)
export function __write_error_selector_ERC721InsufficientApproval(dst: usize): void {
  store<u8>(dst + 0, 0x17);
  store<u8>(dst + 1, 0x7e);
  store<u8>(dst + 2, 0x80);
  store<u8>(dst + 3, 0x2f);
}

export function __create_error_data_ERC721InsufficientApproval(arg0: usize, arg1: usize): usize {
  const errorData: usize = malloc(68);
  __write_error_selector_ERC721InsufficientApproval(errorData); // Write selector
  // Write argument 1: arg0 (address)
  U256.copyInPlace(errorData + 4, arg0);
  // Write argument 2: arg1 (uint256)
  U256.copyInPlace(errorData + 36, arg1);
  return errorData;
}

// Error: ERC721InvalidApprover
// Selector: 0xa9fbf51f
// Signature: ERC721InvalidApprover(address)
export function __write_error_selector_ERC721InvalidApprover(dst: usize): void {
  store<u8>(dst + 0, 0xa9);
  store<u8>(dst + 1, 0xfb);
  store<u8>(dst + 2, 0xf5);
  store<u8>(dst + 3, 0x1f);
}

export function __create_error_data_ERC721InvalidApprover(arg0: usize): usize {
  const errorData: usize = malloc(36);
  __write_error_selector_ERC721InvalidApprover(errorData); // Write selector
  // Write argument 1: arg0 (address)
  U256.copyInPlace(errorData + 4, arg0);
  return errorData;
}

// Error: ERC721InvalidOperator
// Selector: 0x5b08ba18
// Signature: ERC721InvalidOperator(address)
export function __write_error_selector_ERC721InvalidOperator(dst: usize): void {
  store<u8>(dst + 0, 0x5b);
  store<u8>(dst + 1, 0x08);
  store<u8>(dst + 2, 0xba);
  store<u8>(dst + 3, 0x18);
}

export function __create_error_data_ERC721InvalidOperator(arg0: usize): usize {
  const errorData: usize = malloc(36);
  __write_error_selector_ERC721InvalidOperator(errorData); // Write selector
  // Write argument 1: arg0 (address)
  U256.copyInPlace(errorData + 4, arg0);
  return errorData;
}

// Error: ERC721InvalidSender
// Selector: 0x73c6ac6e
// Signature: ERC721InvalidSender(address)
export function __write_error_selector_ERC721InvalidSender(dst: usize): void {
  store<u8>(dst + 0, 0x73);
  store<u8>(dst + 1, 0xc6);
  store<u8>(dst + 2, 0xac);
  store<u8>(dst + 3, 0x6e);
}

export function __create_error_data_ERC721InvalidSender(arg0: usize): usize {
  const errorData: usize = malloc(36);
  __write_error_selector_ERC721InvalidSender(errorData); // Write selector
  // Write argument 1: arg0 (address)
  U256.copyInPlace(errorData + 4, arg0);
  return errorData;
}

export function contract_constructor(arg0: usize, arg1: usize): void {
  const _name = arg0;
  const _symbol = arg1;
  const __strObj_0: usize = _name;
  const nameStr = __strObj_0;
  const __strObj_1: usize = _symbol;
  const symbolStr = __strObj_1;
  store_nameValue(nameStr);
  store_symbolValue(symbolStr);
}

export function approve(arg0: usize, arg1: usize): void {
  const to = arg0;
  const tokenId = arg1;
  const authorizer = Msg.sender();
  const owner = Mapping.getAddress(__SLOT00, tokenId);
  const isOwnerZero = Address.isZero(owner);
  if (isOwnerZero) {
    // Revert with custom error ERC721NonexistentToken
    const __errorData_2: usize = __create_error_data_ERC721NonexistentToken(tokenId);
    abort_with_data(__errorData_2, 36);
  }
  const isOwnerAuth = U256.equals(owner, authorizer);
  const isApprovedForAll = MappingNested.getBoolean(__SLOT03, owner, authorizer);
  const isAuthorized = isOwnerAuth || isApprovedForAll;
  if (Boolean.not(isAuthorized)) {
    // Revert with custom error ERC721InvalidApprover
    const __errorData_3: usize = __create_error_data_ERC721InvalidApprover(authorizer);
    abort_with_data(__errorData_3, 36);
  }
  Mapping.setAddress(__SLOT02, tokenId, to);
  // topic0 for Approval
  const __topics_4: usize = malloc(128);
  __write_topic0_Approval(__topics_4);
  addTopic(__topics_4 + 32, owner, 32);
  addTopic(__topics_4 + 64, to, 32);
  addTopic(__topics_4 + 96, tokenId, 32);
  const __data_5: usize = 0; // no data
  emitTopics(__topics_4, 4, __data_5, 0);
}
export function setApprovalForAll(arg0: usize, arg1: boolean): void {
  const operator = arg0;
  const approved = arg1;
  const isOperatorZero = Address.isZero(operator);
  if (isOperatorZero) {
    // Revert with custom error ERC721InvalidOperator
    const __errorData_6: usize = __create_error_data_ERC721InvalidOperator(operator);
    abort_with_data(__errorData_6, 36);
  }
  const owner = Msg.sender();
  MappingNested.setBoolean(__SLOT03, owner, operator, approved);
  // topic0 for ApprovalForAll
  const __topics_7: usize = malloc(96);
  __write_topic0_ApprovalForAll(__topics_7);
  addTopic(__topics_7 + 32, owner, 32);
  addTopic(__topics_7 + 64, operator, 32);
  const __data_8: usize = malloc(32);
  U256.copyInPlace(__data_8 + 0, Boolean.toABI(approved));
  emitTopics(__topics_7, 3, __data_8, 32);
}
export function transferFrom(arg0: usize, arg1: usize, arg2: usize): void {
  const from = arg0;
  const to = arg1;
  const tokenId = arg2;
  const __hexPtr_9: usize = malloc(42);
  store<u8>(__hexPtr_9 + 0, 48);
  store<u8>(__hexPtr_9 + 1, 120);
  store<u8>(__hexPtr_9 + 2, 48);
  store<u8>(__hexPtr_9 + 3, 48);
  store<u8>(__hexPtr_9 + 4, 48);
  store<u8>(__hexPtr_9 + 5, 48);
  store<u8>(__hexPtr_9 + 6, 48);
  store<u8>(__hexPtr_9 + 7, 48);
  store<u8>(__hexPtr_9 + 8, 48);
  store<u8>(__hexPtr_9 + 9, 48);
  store<u8>(__hexPtr_9 + 10, 48);
  store<u8>(__hexPtr_9 + 11, 48);
  store<u8>(__hexPtr_9 + 12, 48);
  store<u8>(__hexPtr_9 + 13, 48);
  store<u8>(__hexPtr_9 + 14, 48);
  store<u8>(__hexPtr_9 + 15, 48);
  store<u8>(__hexPtr_9 + 16, 48);
  store<u8>(__hexPtr_9 + 17, 48);
  store<u8>(__hexPtr_9 + 18, 48);
  store<u8>(__hexPtr_9 + 19, 48);
  store<u8>(__hexPtr_9 + 20, 48);
  store<u8>(__hexPtr_9 + 21, 48);
  store<u8>(__hexPtr_9 + 22, 48);
  store<u8>(__hexPtr_9 + 23, 48);
  store<u8>(__hexPtr_9 + 24, 48);
  store<u8>(__hexPtr_9 + 25, 48);
  store<u8>(__hexPtr_9 + 26, 48);
  store<u8>(__hexPtr_9 + 27, 48);
  store<u8>(__hexPtr_9 + 28, 48);
  store<u8>(__hexPtr_9 + 29, 48);
  store<u8>(__hexPtr_9 + 30, 48);
  store<u8>(__hexPtr_9 + 31, 48);
  store<u8>(__hexPtr_9 + 32, 48);
  store<u8>(__hexPtr_9 + 33, 48);
  store<u8>(__hexPtr_9 + 34, 48);
  store<u8>(__hexPtr_9 + 35, 48);
  store<u8>(__hexPtr_9 + 36, 48);
  store<u8>(__hexPtr_9 + 37, 48);
  store<u8>(__hexPtr_9 + 38, 48);
  store<u8>(__hexPtr_9 + 39, 48);
  store<u8>(__hexPtr_9 + 40, 48);
  store<u8>(__hexPtr_9 + 41, 48);
  const __hexLen_10: u32 = 42;
  const __addrPtr_11: usize = Address.create();
  Address.setFromStringHex(__addrPtr_11, __hexPtr_9, __hexLen_10);
  const zeroAddress = __addrPtr_11;
  const isToZero = Address.isZero(to);
  if (isToZero) {
    // Revert with custom error ERC721InvalidReceiver
    const __errorData_12: usize = __create_error_data_ERC721InvalidReceiver(to);
    abort_with_data(__errorData_12, 36);
  }
  const owner = Mapping.getAddress(__SLOT00, tokenId);
  const authorizer = Msg.sender();
  const isOwnerZero = Address.isZero(owner);
  const approvedAddress = Mapping.getAddress(__SLOT02, tokenId);
  const isApprovedForAll = MappingNested.getBoolean(__SLOT03, owner, authorizer);
  const isAuthOwner = U256.equals(authorizer, owner);
  const isAuthApproved = U256.equals(authorizer, approvedAddress);
  const isAuthorized = isAuthOwner || isAuthApproved || isApprovedForAll;
  if (Boolean.not(isAuthorized)) {
    if (isOwnerZero) {
      // Revert with custom error ERC721NonexistentToken
      const __errorData_13: usize = __create_error_data_ERC721NonexistentToken(tokenId);
      abort_with_data(__errorData_13, 36);
    } else {
      // Revert with custom error ERC721InsufficientApproval
      const __errorData_14: usize = __create_error_data_ERC721InsufficientApproval(
        authorizer,
        tokenId,
      );
      abort_with_data(__errorData_14, 68);
    }
  }
  const isFromOwner = U256.equals(owner, from);
  if (Boolean.not(isFromOwner)) {
    // Revert with custom error ERC721IncorrectOwner
    const __errorData_15: usize = __create_error_data_ERC721IncorrectOwner(
      authorizer,
      tokenId,
      owner,
    );
    abort_with_data(__errorData_15, 100);
  }
  const isFromZero = Address.isZero(owner);
  if (Boolean.not(isFromZero)) {
    Mapping.setAddress(__SLOT02, tokenId, zeroAddress);
    const fromBalance = Mapping.getU256(__SLOT01, owner);
    const __str_16: usize = malloc(1);
    store<u8>(__str_16 + 0, 49);
    const __len_17: u32 = 1;
    Mapping.setU256(__SLOT01, owner, U256.sub(fromBalance, U256.fromString(__str_16, __len_17)));
  }
  if (Boolean.not(isToZero)) {
    const toBalance = Mapping.getU256(__SLOT01, to);
    const __str_18: usize = malloc(1);
    store<u8>(__str_18 + 0, 49);
    const __len_19: u32 = 1;
    Mapping.setU256(__SLOT01, to, U256.add(toBalance, U256.fromString(__str_18, __len_19)));
  }
  Mapping.setAddress(__SLOT00, tokenId, to);
  // topic0 for Transfer
  const __topics_20: usize = malloc(128);
  __write_topic0_Transfer(__topics_20);
  addTopic(__topics_20 + 32, owner, 32);
  addTopic(__topics_20 + 64, to, 32);
  addTopic(__topics_20 + 96, tokenId, 32);
  const __data_21: usize = 0; // no data
  emitTopics(__topics_20, 4, __data_21, 0);
}
export function mint(arg0: usize, arg1: usize): void {
  const to = arg0;
  const tokenId = arg1;
  const __hexPtr_22: usize = malloc(42);
  store<u8>(__hexPtr_22 + 0, 48);
  store<u8>(__hexPtr_22 + 1, 120);
  store<u8>(__hexPtr_22 + 2, 48);
  store<u8>(__hexPtr_22 + 3, 48);
  store<u8>(__hexPtr_22 + 4, 48);
  store<u8>(__hexPtr_22 + 5, 48);
  store<u8>(__hexPtr_22 + 6, 48);
  store<u8>(__hexPtr_22 + 7, 48);
  store<u8>(__hexPtr_22 + 8, 48);
  store<u8>(__hexPtr_22 + 9, 48);
  store<u8>(__hexPtr_22 + 10, 48);
  store<u8>(__hexPtr_22 + 11, 48);
  store<u8>(__hexPtr_22 + 12, 48);
  store<u8>(__hexPtr_22 + 13, 48);
  store<u8>(__hexPtr_22 + 14, 48);
  store<u8>(__hexPtr_22 + 15, 48);
  store<u8>(__hexPtr_22 + 16, 48);
  store<u8>(__hexPtr_22 + 17, 48);
  store<u8>(__hexPtr_22 + 18, 48);
  store<u8>(__hexPtr_22 + 19, 48);
  store<u8>(__hexPtr_22 + 20, 48);
  store<u8>(__hexPtr_22 + 21, 48);
  store<u8>(__hexPtr_22 + 22, 48);
  store<u8>(__hexPtr_22 + 23, 48);
  store<u8>(__hexPtr_22 + 24, 48);
  store<u8>(__hexPtr_22 + 25, 48);
  store<u8>(__hexPtr_22 + 26, 48);
  store<u8>(__hexPtr_22 + 27, 48);
  store<u8>(__hexPtr_22 + 28, 48);
  store<u8>(__hexPtr_22 + 29, 48);
  store<u8>(__hexPtr_22 + 30, 48);
  store<u8>(__hexPtr_22 + 31, 48);
  store<u8>(__hexPtr_22 + 32, 48);
  store<u8>(__hexPtr_22 + 33, 48);
  store<u8>(__hexPtr_22 + 34, 48);
  store<u8>(__hexPtr_22 + 35, 48);
  store<u8>(__hexPtr_22 + 36, 48);
  store<u8>(__hexPtr_22 + 37, 48);
  store<u8>(__hexPtr_22 + 38, 48);
  store<u8>(__hexPtr_22 + 39, 48);
  store<u8>(__hexPtr_22 + 40, 48);
  store<u8>(__hexPtr_22 + 41, 48);
  const __hexLen_23: u32 = 42;
  const __addrPtr_24: usize = Address.create();
  Address.setFromStringHex(__addrPtr_24, __hexPtr_22, __hexLen_23);
  const zeroAddress = __addrPtr_24;
  const isToZero = Address.isZero(to);
  if (isToZero) {
    // Revert with custom error ERC721InvalidReceiver
    const __errorData_25: usize = __create_error_data_ERC721InvalidReceiver(zeroAddress);
    abort_with_data(__errorData_25, 36);
  }
  const from = Mapping.getAddress(__SLOT00, tokenId);
  const isFromZero = Address.isZero(from);
  if (Boolean.not(isFromZero)) {
    // Revert with custom error ERC721InvalidSender
    const __errorData_26: usize = __create_error_data_ERC721InvalidSender(zeroAddress);
    abort_with_data(__errorData_26, 36);
  }
  if (Boolean.not(isToZero)) {
    const toBalance = Mapping.getU256(__SLOT01, to);
    const __str_27: usize = malloc(1);
    store<u8>(__str_27 + 0, 49);
    const __len_28: u32 = 1;
    Mapping.setU256(__SLOT01, to, U256.add(toBalance, U256.fromString(__str_27, __len_28)));
  }
  Mapping.setAddress(__SLOT00, tokenId, to);
  // topic0 for Transfer
  const __topics_29: usize = malloc(128);
  __write_topic0_Transfer(__topics_29);
  addTopic(__topics_29 + 32, from, 32);
  addTopic(__topics_29 + 64, to, 32);
  addTopic(__topics_29 + 96, tokenId, 32);
  const __data_30: usize = 0; // no data
  emitTopics(__topics_29, 4, __data_30, 0);
}
export function burn(arg0: usize): void {
  const tokenId = arg0;
  const __hexPtr_31: usize = malloc(42);
  store<u8>(__hexPtr_31 + 0, 48);
  store<u8>(__hexPtr_31 + 1, 120);
  store<u8>(__hexPtr_31 + 2, 48);
  store<u8>(__hexPtr_31 + 3, 48);
  store<u8>(__hexPtr_31 + 4, 48);
  store<u8>(__hexPtr_31 + 5, 48);
  store<u8>(__hexPtr_31 + 6, 48);
  store<u8>(__hexPtr_31 + 7, 48);
  store<u8>(__hexPtr_31 + 8, 48);
  store<u8>(__hexPtr_31 + 9, 48);
  store<u8>(__hexPtr_31 + 10, 48);
  store<u8>(__hexPtr_31 + 11, 48);
  store<u8>(__hexPtr_31 + 12, 48);
  store<u8>(__hexPtr_31 + 13, 48);
  store<u8>(__hexPtr_31 + 14, 48);
  store<u8>(__hexPtr_31 + 15, 48);
  store<u8>(__hexPtr_31 + 16, 48);
  store<u8>(__hexPtr_31 + 17, 48);
  store<u8>(__hexPtr_31 + 18, 48);
  store<u8>(__hexPtr_31 + 19, 48);
  store<u8>(__hexPtr_31 + 20, 48);
  store<u8>(__hexPtr_31 + 21, 48);
  store<u8>(__hexPtr_31 + 22, 48);
  store<u8>(__hexPtr_31 + 23, 48);
  store<u8>(__hexPtr_31 + 24, 48);
  store<u8>(__hexPtr_31 + 25, 48);
  store<u8>(__hexPtr_31 + 26, 48);
  store<u8>(__hexPtr_31 + 27, 48);
  store<u8>(__hexPtr_31 + 28, 48);
  store<u8>(__hexPtr_31 + 29, 48);
  store<u8>(__hexPtr_31 + 30, 48);
  store<u8>(__hexPtr_31 + 31, 48);
  store<u8>(__hexPtr_31 + 32, 48);
  store<u8>(__hexPtr_31 + 33, 48);
  store<u8>(__hexPtr_31 + 34, 48);
  store<u8>(__hexPtr_31 + 35, 48);
  store<u8>(__hexPtr_31 + 36, 48);
  store<u8>(__hexPtr_31 + 37, 48);
  store<u8>(__hexPtr_31 + 38, 48);
  store<u8>(__hexPtr_31 + 39, 48);
  store<u8>(__hexPtr_31 + 40, 48);
  store<u8>(__hexPtr_31 + 41, 48);
  const __hexLen_32: u32 = 42;
  const __addrPtr_33: usize = Address.create();
  Address.setFromStringHex(__addrPtr_33, __hexPtr_31, __hexLen_32);
  const zeroAddress = __addrPtr_33;
  const from = Mapping.getAddress(__SLOT00, tokenId);
  const isFromZero = Address.isZero(from);
  if (Boolean.not(isFromZero)) {
    Mapping.setAddress(__SLOT02, tokenId, zeroAddress);
    const fromBalance = Mapping.getU256(__SLOT01, from);
    const __str_34: usize = malloc(1);
    store<u8>(__str_34 + 0, 49);
    const __len_35: u32 = 1;
    Mapping.setU256(__SLOT01, from, U256.sub(fromBalance, U256.fromString(__str_34, __len_35)));
  }
  Mapping.setAddress(__SLOT00, tokenId, zeroAddress);
  // topic0 for Transfer
  const __topics_36: usize = malloc(128);
  __write_topic0_Transfer(__topics_36);
  addTopic(__topics_36 + 32, from, 32);
  addTopic(__topics_36 + 64, zeroAddress, 32);
  addTopic(__topics_36 + 96, tokenId, 32);
  const __data_37: usize = 0; // no data
  emitTopics(__topics_36, 4, __data_37, 0);
  if (isFromZero) {
    // Revert with custom error ERC721NonexistentToken
    const __errorData_38: usize = __create_error_data_ERC721NonexistentToken(tokenId);
    abort_with_data(__errorData_38, 36);
  }
}
export function balanceOf(arg0: usize): usize {
  const owner = arg0;
  const isOwnerZero = Address.isZero(owner);
  if (isOwnerZero) {
    // Revert with custom error ERC721InvalidOwner
    const __errorData_39: usize = __create_error_data_ERC721InvalidOwner(owner);
    abort_with_data(__errorData_39, 36);
  }
  return Mapping.getU256(__SLOT01, owner);
}
export function ownerOf(arg0: usize): usize {
  const tokenId = arg0;
  const owner = Mapping.getAddress(__SLOT00, tokenId);
  const isZero = Address.isZero(Mapping.getAddress(__SLOT00, tokenId));
  if (isZero) {
    // Revert with custom error ERC721NonexistentToken
    const __errorData_40: usize = __create_error_data_ERC721NonexistentToken(tokenId);
    abort_with_data(__errorData_40, 36);
  }
  return owner;
}
export function name(): usize {
  return load_nameValue();
}
export function symbol(): usize {
  return load_symbolValue();
}
export function getApproved(arg0: usize): usize {
  const tokenId = arg0;
  const owner = Mapping.getAddress(__SLOT00, tokenId);
  const isZero = Address.isZero(owner);
  if (isZero) {
    // Revert with custom error ERC721NonexistentToken
    const __errorData_41: usize = __create_error_data_ERC721NonexistentToken(tokenId);
    abort_with_data(__errorData_41, 36);
  }
  return Mapping.getAddress(__SLOT02, tokenId);
}
export function isApprovedForAll(arg0: usize, arg1: usize): boolean {
  const owner = arg0;
  const operator = arg1;
  return MappingNested.getBoolean(__SLOT03, owner, operator);
}
`;
