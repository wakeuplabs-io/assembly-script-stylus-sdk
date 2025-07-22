export const ERC20_CONTRACT_CODE = `// ERC-20 Token Contract
// @ts-nocheck

@Event
export class Transfer {
  @Indexed from: Address;
  @Indexed to: Address;
  value: U256;
}

@Event
export class Approval {
  @Indexed owner: Address;
  @Indexed spender: Address;
  value: U256;
}

@Contract
export class ERC20Full {
  static balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  static allowances: Mapping2<Address, Address, U256> = new Mapping2<Address, Address, U256>();
  static totalSupply: U256;
  static name: Str;
  static symbol: Str;

  constructor(_name: string, _symbol: string) {
    const nameStr = StrFactory.fromString(_name);
    const symbolStr = StrFactory.fromString(_symbol);
    name = nameStr;
    symbol = symbolStr;
  }

  @View
  static name(): string {
    return name;
  }

  @View
  static symbol(): string {
    return symbol;
  }

  @View
  static decimals(): U256 {
    return U256Factory.fromString("18");
  }

  @View
  static totalSupply(): U256 {
    return totalSupply;
  }

  @View
  static balanceOf(account: Address): U256 {
    return balances.get(account);
  }

  @View
  static allowance(owner: Address, spender: Address): U256 {
    return allowances.get(owner, spender);
  }

  @External
  static transfer(to: Address, amount: U256): boolean {
    const sender = msg.sender;
    const senderBal = balances.get(sender);
    if (senderBal < amount) {
      return false;
    }
    balances.set(sender, senderBal.sub(amount));
    const recvBal = balances.get(to);
    balances.set(to, recvBal.add(amount));
    Transfer.emit(sender, to, amount);
    return true;
  }

  @External
  static approve(spender: Address, amount: U256): boolean {
    const owner = msg.sender;
    allowances.set(owner, spender, amount);
    Approval.emit(owner, spender, amount);
    return true;
  }

  @External
  static transferFrom(from: Address, to: Address, amount: U256): boolean {
    const spender = msg.sender;
    const allowed = allowances.get(from, spender);
    if (allowed < amount) {
      return false;
    }
    const fromBal = balances.get(from);
    if (fromBal < amount) {
      return false;
    }
    const newAllowed = allowed.sub(amount);
    balances.set(from, fromBal.sub(amount));
    const toBal = balances.get(to);
    balances.set(to, toBal.add(amount));
    allowances.set(from, spender, newAllowed);
    Transfer.emit(from, to, amount);
    Approval.emit(from, spender, newAllowed);
    return true;
  }

  @External
  static mint(to: Address, amount: U256): void {
    totalSupply = totalSupply.add(amount);
    const toAmount = balances.get(to);
    const newAmount = toAmount.add(amount);
    balances.set(to, newAmount);
    const AddressZero = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    Transfer.emit(AddressZero, to, amount);
  }

  @External
  static burn(amount: U256): void {
    const sender = msg.sender;
    const senderBal = balances.get(sender);
    if (senderBal < amount) {
      return;
    }
    balances.set(sender, senderBal.sub(amount));
    totalSupply = totalSupply.sub(amount);
    const AddressZero = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    Transfer.emit(sender, AddressZero, amount);
  }
}`

export const ERC721_CONTRACT_CODE = `// ERC-721 NFT Contract
// @ts-nocheck

@Error
class ERC721InvalidOwner {
  owner: Address;
}

@Error
class ERC721NonexistentToken {
  tokenId: U256;
}

@Error
class ERC721IncorrectOwner {
  sender: Address;
  tokenId: U256;
  owner: Address;
}

@Error
class ERC721InvalidSender {
  sender: Address;
}

@Error
class ERC721InvalidReceiver {
  receiver: Address;
}

@Error
class ERC721InsufficientApproval {
  sender: Address;
  tokenId: U256;
}

@Error
class ERC721InvalidApprover {
  approver: Address;
}

@Error
class ERC721InvalidOperator {
  operator: Address;
}

@Event
export class Transfer {
  @Indexed from: Address;
  @Indexed to: Address;
  @Indexed tokenId: U256;
}

@Event
export class Approval {
  @Indexed owner: Address;
  @Indexed spender: Address;
  @Indexed tokenId: U256;
}

@Event
export class ApprovalForAll {
  @Indexed owner: Address;
  @Indexed operator: Address;
  approved: boolean;
}

@Contract
export class ERC721 {
  // Storage mappings
  static owners: Mapping<U256, Address> = new Mapping<U256, Address>();
  static balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  static tokenApprovals: Mapping<U256, Address> = new Mapping<U256, Address>();
  static operatorApprovals: Mapping2<Address, Address, boolean> = new Mapping2<Address, Address, boolean>();
  static name: Str;
  static symbol: Str;

  constructor(_name: string, _symbol: string) {
    const nameStr = StrFactory.fromString(_name);
    const symbolStr = StrFactory.fromString(_symbol);
    name = nameStr;
    symbol = symbolStr;
  }

  // ===== EXTERNAL FUNCTIONS =====

  @External
  static approve(to: Address, tokenId: U256): void {
    const authorizer = msg.sender;
    const owner = owners.get(tokenId);
    const isOwnerZero = owner.isZero();
    if (isOwnerZero) {
      ERC721NonexistentToken.revert(tokenId);
    }
    const isOwnerAuth = owner.equals(authorizer);
    const isApprovedForAll = operatorApprovals.get(owner, authorizer);
    const isAuthorized = isOwnerAuth || isApprovedForAll;
    if (!isAuthorized) {
      ERC721InvalidApprover.revert(authorizer);
    }
    tokenApprovals.set(tokenId, to);
    Approval.emit(owner, to, tokenId);
  }

  @External
  static setApprovalForAll(operator: Address, approved: boolean): void {
    const isOperatorZero = operator.isZero();
    if (isOperatorZero) {
      ERC721InvalidOperator.revert(operator);
    }
    const owner = msg.sender;
    operatorApprovals.set(owner, operator, approved);
    ApprovalForAll.emit(owner, operator, approved);
  }

  @External
  static transferFrom(from: Address, to: Address, tokenId: U256): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    const one = U256Factory.fromString("1");
    
    const isToZero = to.isZero();
    if (isToZero) {
      ERC721InvalidReceiver.revert(to);
    }
    
    const owner = owners.get(tokenId);
    const authorizer = msg.sender;
    const isOwnerZero = owner.isZero();
    const approvedAddress = tokenApprovals.get(tokenId);
    const isApprovedForAll = operatorApprovals.get(owner, authorizer);
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
      tokenApprovals.set(tokenId, zeroAddress);
      const fromBalance = balances.get(owner);
      balances.set(owner, fromBalance.sub(one));
    }
    
    if (!isToZero) {
      const toBalance = balances.get(to);
      balances.set(to, toBalance.add(one));
    }
    
    owners.set(tokenId, to);
    Transfer.emit(owner, to, tokenId);
  }

  @External
  static mint(to: Address, tokenId: U256): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    const one = U256Factory.fromString("1");
    
    const isToZero = to.isZero();
    if (isToZero) {
      ERC721InvalidReceiver.revert(zeroAddress);
    }
    
    const from = owners.get(tokenId);
    const isFromZero = from.isZero();
    if (!isFromZero) {
      ERC721InvalidSender.revert(zeroAddress);
    }
    
    if (!isToZero) {
      const toBalance = balances.get(to);
      balances.set(to, toBalance.add(one));
    }
    
    owners.set(tokenId, to);
    Transfer.emit(from, to, tokenId);
  }

  @External
  static burn(tokenId: U256): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    const one = U256Factory.fromString("1");
    
    const from = owners.get(tokenId);
    const isFromZero = from.isZero();
    if (!isFromZero) {
      tokenApprovals.set(tokenId, zeroAddress);
      const fromBalance = balances.get(from);
      balances.set(from, fromBalance.sub(one));
    }
    
    owners.set(tokenId, zeroAddress);
    Transfer.emit(from, zeroAddress, tokenId);
    
    if (isFromZero) {
      ERC721NonexistentToken.revert(tokenId);
    }
  }

  // ===== VIEW FUNCTIONS =====

  @View
  static balanceOf(owner: Address): U256 {
    const isOwnerZero = owner.isZero();
    if (isOwnerZero) {
      ERC721InvalidOwner.revert(owner);
    }
    return balances.get(owner);
  }

  @View
  static ownerOf(tokenId: U256): Address {
    const owner = owners.get(tokenId);
    const isZero = owner.isZero();
    if (isZero) ERC721NonexistentToken.revert(tokenId);
    return owner;
  }

  @View
  static name(): string {
    return name;
  }

  @View
  static symbol(): string {
    return symbol;
  }

  @View
  static getApproved(tokenId: U256): Address {
    const owner = owners.get(tokenId);
    const isZero = owner.isZero();
    if (isZero) ERC721NonexistentToken.revert(tokenId);
    return tokenApprovals.get(tokenId);
  }

  @View
  static isApprovedForAll(owner: Address, operator: Address): boolean {
    return operatorApprovals.get(owner, operator);
  }
}`

export const ENTRYPOINT_CODE = `// user_entrypoint.ts - Auto-generated

/* eslint-disable */

// Auto-generated contract template
import "./assembly/stylus/stylus";
import { __keep_imports } from "as-stylus/core/modules/keep-imports";
import { read_args, write_result } from "as-stylus/core/modules/hostio";
import { initHeap, malloc } from "as-stylus/core/modules/memory";
import { loadU32BE } from "as-stylus/core/modules/endianness";
import { Str } from "as-stylus/core/types/str";
import { Boolean } from "as-stylus/core/types/boolean";
import { U256 } from "as-stylus/core/types/u256";
import { createStorageKey } from "as-stylus/core/modules/storage";
import { storage_load_bytes32, storage_cache_bytes32, storage_flush_cache } from "as-stylus/core/modules/hostio";

import { name } from "./contract.transformed";
import { symbol } from "./contract.transformed";
import { decimals } from "./contract.transformed";
import { totalSupply } from "./contract.transformed";
import { balanceOf } from "./contract.transformed";
import { allowance } from "./contract.transformed";
import { transfer } from "./contract.transformed";
import { approve } from "./contract.transformed";
import { transferFrom } from "./contract.transformed";
import { mint } from "./contract.transformed";
import { burn } from "./contract.transformed";
import { contract_constructor } from "./contract.transformed";

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
  let result: u64 = 0;

  if (isFirstTimeDeploy()) {
    store_initialized_storage(Boolean.create(true));
    return 0;
  }

    if (selector == 0x06fdde03) {
    const buf = name();
    const len = loadU32BE(buf + 60);
    const padded = ((len + 31) & ~31);
    write_result(buf, 64 + padded);
    return 0;
  }
  if (selector == 0x95d89b41) {
    const buf = symbol();
    const len = loadU32BE(buf + 60);
    const padded = ((len + 31) & ~31);
    write_result(buf, 64 + padded);
    return 0;
  }
  if (selector == 0x313ce567) {
    let ptr = decimals(); write_result(ptr, 32); return 0;
  }
  if (selector == 0x18160ddd) {
    let ptr = totalSupply(); write_result(ptr, 32); return 0;
  }
  if (selector == 0x70a08231) {
    const arg0 = position + 4;
    let ptr = balanceOf(arg0); write_result(ptr, 32); return 0;
  }
  if (selector == 0xdd62ed3e) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    let ptr = allowance(arg0, arg1); write_result(ptr, 32); return 0;
  }
  if (selector == 0xa9059cbb) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    let ptr = transfer(arg0, arg1); write_result(ptr, 32); return 0;
  }
  if (selector == 0x095ea7b3) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    let ptr = approve(arg0, arg1); write_result(ptr, 32); return 0;
  }
  if (selector == 0x23b872dd) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    const arg2 = position + 68;
    let ptr = transferFrom(arg0, arg1, arg2); write_result(ptr, 32); return 0;
  }
  if (selector == 0x40c10f19) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    mint(arg0, arg1); return 0;
  }
  if (selector == 0x42966c68) {
    const arg0 = position + 4;
    burn(arg0); return 0;
  }
  if (selector == 0x71742007) {
    const arg0 = Str.fromDynamicArg(position + 4, position + 4);
    const arg1 = Str.fromDynamicArg(position + 4, position + 36);
    contract_constructor(arg0, arg1); return 0;
  }
  return 0;
}`

export const CONTRACT_TRANSFORMED = `import {
  storage_load_bytes32,
  storage_cache_bytes32,
  storage_flush_cache,
} from "as-stylus/core/modules/hostio";
import { createStorageKey } from "as-stylus/core/modules/storage";
import { addTopic, emitTopics } from "as-stylus/core/modules/events";
import { Mapping } from "as-stylus/core/types/mapping";
import { Mapping2 } from "as-stylus/core/types/mapping2";
import { Boolean } from "as-stylus/core/types/boolean";
import { Address } from "as-stylus/core/types/address";
import { U256 } from "as-stylus/core/types/u256";
import { Str } from "as-stylus/core/types/str";
import { Msg } from "as-stylus/core/types/msg";
import { malloc } from "as-stylus/core/modules/memory";

const __SLOT01: u64 = 1;
const __SLOT02: u64 = 2;
const __SLOT03: u64 = 3;

function load_totalSupply(): usize {
  const ptr = U256.create();
  storage_load_bytes32(createStorageKey(__SLOT03), ptr);
  return ptr;
}

function store_totalSupply(ptr: usize): void {
  storage_cache_bytes32(createStorageKey(__SLOT03), ptr);
  storage_flush_cache(0);
}
const __SLOT04: u64 = 4;
function load_name(): usize {
  return Str.loadFrom(__SLOT04);
}

function store_name(strPtr: usize): void {
  Str.storeTo(__SLOT04, strPtr);
}
const __SLOT05: u64 = 5;
function load_symbol(): usize {
  return Str.loadFrom(__SLOT05);
}

function store_symbol(strPtr: usize): void {
  Str.storeTo(__SLOT05, strPtr);
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
  const defaulttotalSupply = U256.create();
  store_totalSupply(defaulttotalSupply);
  const emptyname = Str.create();
  store_name(emptyname);
  const emptysymbol = Str.create();
  store_symbol(emptysymbol);
  const __strObj_0: usize = _name;
  const nameStr = __strObj_0;
  const __strObj_1: usize = _symbol;
  const symbolStr = __strObj_1;
  store_name(nameStr);
  store_symbol(symbolStr);
}

export function name(): usize {
  return Str.toABI(load_name());
}
export function symbol(): usize {
  return Str.toABI(load_symbol());
}
export function decimals(): usize {
  const __str_3: usize = malloc(2);
  store<u8>(__str_3 + 0, 49);
  store<u8>(__str_3 + 1, 56);
  const __len_4: u32 = 2;
  const __u256_2: usize = U256.create();
  U256.setFromString(__u256_2, __str_3, __len_4);
  return __u256_2;
}
export function totalSupply(): usize {
  return load_totalSupply();
}
export function balanceOf(arg0: usize): usize {
  const account = arg0;
  return Mapping.getU256(__SLOT01, account);
}
export function allowance(arg0: usize, arg1: usize): usize {
  const owner = arg0;
  const spender = arg1;
  return Mapping2.getU256(__SLOT02, owner, spender);
}
export function transfer(arg0: usize, arg1: usize): usize {
  const to = arg0;
  const amount = arg1;
  const sender = Msg.sender();
  const senderBal = Mapping.getU256(__SLOT01, sender);
  if (U256.lessThan(senderBal, amount)) {
    return Boolean.create(false);
  }
  Mapping.setU256(__SLOT01, sender, U256.sub(senderBal, amount));
  const recvBal = Mapping.getU256(__SLOT01, to);
  Mapping.setU256(__SLOT01, to, U256.add(recvBal, amount));
  // topic0 for Transfer
  const __topics_5: usize = malloc(96);
  __write_topic0_Transfer(__topics_5);
  addTopic(__topics_5 + 32, sender, 32);
  addTopic(__topics_5 + 64, to, 32);
  const __data_6: usize = malloc(32);
  U256.copy(__data_6 + 0, amount);
  emitTopics(__topics_5, 3, __data_6, 32);
  return Boolean.create(true);
}
export function approve(arg0: usize, arg1: usize): usize {
  const spender = arg0;
  const amount = arg1;
  const owner = Msg.sender();
  Mapping2.setU256(__SLOT02, owner, spender, amount);
  // topic0 for Approval
  const __topics_7: usize = malloc(96);
  __write_topic0_Approval(__topics_7);
  addTopic(__topics_7 + 32, owner, 32);
  addTopic(__topics_7 + 64, spender, 32);
  const __data_8: usize = malloc(32);
  U256.copy(__data_8 + 0, amount);
  emitTopics(__topics_7, 3, __data_8, 32);
  return Boolean.create(true);
}
export function transferFrom(arg0: usize, arg1: usize, arg2: usize): usize {
  const from = arg0;
  const to = arg1;
  const amount = arg2;
  const spender = Msg.sender();
  const allowed = Mapping2.getU256(__SLOT02, from, spender);
  if (U256.lessThan(allowed, amount)) {
    return Boolean.create(false);
  }
  const fromBal = Mapping.getU256(__SLOT01, from);
  if (U256.lessThan(fromBal, amount)) {
    return Boolean.create(false);
  }
  const newAllowed = U256.sub(allowed, amount);
  Mapping.setU256(__SLOT01, from, U256.sub(fromBal, amount));
  const toBal = Mapping.getU256(__SLOT01, to);
  Mapping.setU256(__SLOT01, to, U256.add(toBal, amount));
  Mapping2.setU256(__SLOT02, from, spender, newAllowed);
  // topic0 for Transfer
  const __topics_9: usize = malloc(96);
  __write_topic0_Transfer(__topics_9);
  addTopic(__topics_9 + 32, from, 32);
  addTopic(__topics_9 + 64, to, 32);
  const __data_10: usize = malloc(32);
  U256.copy(__data_10 + 0, amount);
  emitTopics(__topics_9, 3, __data_10, 32);
  // topic0 for Approval
  const __topics_11: usize = malloc(96);
  __write_topic0_Approval(__topics_11);
  addTopic(__topics_11 + 32, from, 32);
  addTopic(__topics_11 + 64, spender, 32);
  const __data_12: usize = malloc(32);
  U256.copy(__data_12 + 0, newAllowed);
  emitTopics(__topics_11, 3, __data_12, 32);
  return Boolean.create(true);
}
export function mint(arg0: usize, arg1: usize): void {
  const to = arg0;
  const amount = arg1;
  store_totalSupply(U256.add(load_totalSupply(), amount));
  const toAmount = Mapping.getU256(__SLOT01, to);
  const newAmount = U256.add(toAmount, amount);
  Mapping.setU256(__SLOT01, to, newAmount);
  const __hexPtr_13: usize = malloc(42);
  store<u8>(__hexPtr_13 + 0, 48);
  store<u8>(__hexPtr_13 + 1, 120);
  store<u8>(__hexPtr_13 + 2, 48);
  store<u8>(__hexPtr_13 + 3, 48);
  store<u8>(__hexPtr_13 + 4, 48);
  store<u8>(__hexPtr_13 + 5, 48);
  store<u8>(__hexPtr_13 + 6, 48);
  store<u8>(__hexPtr_13 + 7, 48);
  store<u8>(__hexPtr_13 + 8, 48);
  store<u8>(__hexPtr_13 + 9, 48);
  store<u8>(__hexPtr_13 + 10, 48);
  store<u8>(__hexPtr_13 + 11, 48);
  store<u8>(__hexPtr_13 + 12, 48);
  store<u8>(__hexPtr_13 + 13, 48);
  store<u8>(__hexPtr_13 + 14, 48);
  store<u8>(__hexPtr_13 + 15, 48);
  store<u8>(__hexPtr_13 + 16, 48);
  store<u8>(__hexPtr_13 + 17, 48);
  store<u8>(__hexPtr_13 + 18, 48);
  store<u8>(__hexPtr_13 + 19, 48);
  store<u8>(__hexPtr_13 + 20, 48);
  store<u8>(__hexPtr_13 + 21, 48);
  store<u8>(__hexPtr_13 + 22, 48);
  store<u8>(__hexPtr_13 + 23, 48);
  store<u8>(__hexPtr_13 + 24, 48);
  store<u8>(__hexPtr_13 + 25, 48);
  store<u8>(__hexPtr_13 + 26, 48);
  store<u8>(__hexPtr_13 + 27, 48);
  store<u8>(__hexPtr_13 + 28, 48);
  store<u8>(__hexPtr_13 + 29, 48);
  store<u8>(__hexPtr_13 + 30, 48);
  store<u8>(__hexPtr_13 + 31, 48);
  store<u8>(__hexPtr_13 + 32, 48);
  store<u8>(__hexPtr_13 + 33, 48);
  store<u8>(__hexPtr_13 + 34, 48);
  store<u8>(__hexPtr_13 + 35, 48);
  store<u8>(__hexPtr_13 + 36, 48);
  store<u8>(__hexPtr_13 + 37, 48);
  store<u8>(__hexPtr_13 + 38, 48);
  store<u8>(__hexPtr_13 + 39, 48);
  store<u8>(__hexPtr_13 + 40, 48);
  store<u8>(__hexPtr_13 + 41, 48);
  const __hexLen_14: u32 = 42;
  const __addrPtr_15: usize = Address.create();
  Address.setFromStringHex(__addrPtr_15, __hexPtr_13, __hexLen_14);
  const AddressZero = __addrPtr_15;
  // topic0 for Transfer
  const __topics_16: usize = malloc(96);
  __write_topic0_Transfer(__topics_16);
  addTopic(__topics_16 + 32, AddressZero, 32);
  addTopic(__topics_16 + 64, to, 32);
  const __data_17: usize = malloc(32);
  U256.copy(__data_17 + 0, amount);
  emitTopics(__topics_16, 3, __data_17, 32);
}
export function burn(arg0: usize): void {
  const amount = arg0;
  const sender = Msg.sender();
  const senderBal = Mapping.getU256(__SLOT01, sender);
  if (U256.lessThan(senderBal, amount)) {
    return;
  }
  Mapping.setU256(__SLOT01, sender, U256.sub(senderBal, amount));
  store_totalSupply(U256.sub(load_totalSupply(), amount));
  const __hexPtr_18: usize = malloc(42);
  store<u8>(__hexPtr_18 + 0, 48);
  store<u8>(__hexPtr_18 + 1, 120);
  store<u8>(__hexPtr_18 + 2, 48);
  store<u8>(__hexPtr_18 + 3, 48);
  store<u8>(__hexPtr_18 + 4, 48);
  store<u8>(__hexPtr_18 + 5, 48);
  store<u8>(__hexPtr_18 + 6, 48);
  store<u8>(__hexPtr_18 + 7, 48);
  store<u8>(__hexPtr_18 + 8, 48);
  store<u8>(__hexPtr_18 + 9, 48);
  store<u8>(__hexPtr_18 + 10, 48);
  store<u8>(__hexPtr_18 + 11, 48);
  store<u8>(__hexPtr_18 + 12, 48);
  store<u8>(__hexPtr_18 + 13, 48);
  store<u8>(__hexPtr_18 + 14, 48);
  store<u8>(__hexPtr_18 + 15, 48);
  store<u8>(__hexPtr_18 + 16, 48);
  store<u8>(__hexPtr_18 + 17, 48);
  store<u8>(__hexPtr_18 + 18, 48);
  store<u8>(__hexPtr_18 + 19, 48);
  store<u8>(__hexPtr_18 + 20, 48);
  store<u8>(__hexPtr_18 + 21, 48);
  store<u8>(__hexPtr_18 + 22, 48);
  store<u8>(__hexPtr_18 + 23, 48);
  store<u8>(__hexPtr_18 + 24, 48);
  store<u8>(__hexPtr_18 + 25, 48);
  store<u8>(__hexPtr_18 + 26, 48);
  store<u8>(__hexPtr_18 + 27, 48);
  store<u8>(__hexPtr_18 + 28, 48);
  store<u8>(__hexPtr_18 + 29, 48);
  store<u8>(__hexPtr_18 + 30, 48);
  store<u8>(__hexPtr_18 + 31, 48);
  store<u8>(__hexPtr_18 + 32, 48);
  store<u8>(__hexPtr_18 + 33, 48);
  store<u8>(__hexPtr_18 + 34, 48);
  store<u8>(__hexPtr_18 + 35, 48);
  store<u8>(__hexPtr_18 + 36, 48);
  store<u8>(__hexPtr_18 + 37, 48);
  store<u8>(__hexPtr_18 + 38, 48);
  store<u8>(__hexPtr_18 + 39, 48);
  store<u8>(__hexPtr_18 + 40, 48);
  store<u8>(__hexPtr_18 + 41, 48);
  const __hexLen_19: u32 = 42;
  const __addrPtr_20: usize = Address.create();
  Address.setFromStringHex(__addrPtr_20, __hexPtr_18, __hexLen_19);
  const AddressZero = __addrPtr_20;
  // topic0 for Transfer
  const __topics_21: usize = malloc(96);
  __write_topic0_Transfer(__topics_21);
  addTopic(__topics_21 + 32, sender, 32);
  addTopic(__topics_21 + 64, AddressZero, 32);
  const __data_22: usize = malloc(32);
  U256.copy(__data_22 + 0, amount);
  emitTopics(__topics_21, 3, __data_22, 32);
}`

export const ABI_CODE = `[
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function", 
    "name": "symbol",
    "inputs": [],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "decimals", 
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{"name": "account", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  }
]`

export const WASM_CODE = `0061736d0100000001360b6000017f60017f0060027f7f0060037f7f7f0060017f017e60027f7f017f60037f7f7f017f60047f7f7f7f017f60047f7f7f7f0060057f7f7f7f7f0060087f7f7f7f7f7f7f7f017f02c0010e03656e7610696e7374616e74696174650000...` 