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

export const ERC20_ENTRYPOINT_CODE = `// user_entrypoint.ts - Auto-generated
/* eslint-disable */
import "./assembly/stylus/stylus";
import { __keep_imports } from "as-stylus/core/modules/keep-imports";
import { Boolean } from "as-stylus/core/types/boolean";
import { U256 } from "as-stylus/core/types/u256";
import { createStorageKey } from "as-stylus/core/modules/storage";
import { storage_load_bytes32, storage_cache_bytes32, storage_flush_cache } from "as-stylus/core/modules/hostio";

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

export const ERC20_CONTRACT_TRANSFORMED = `import {
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

export const ERC721_ENTRYPOINT_CODE = `// user_entrypoint.ts - Auto-generated
/* eslint-disable */
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

import { approve } from "./contract.transformed";
import { setApprovalForAll } from "./contract.transformed";
import { transferFrom } from "./contract.transformed";
import { safeTransferFrom } from "./contract.transformed";
import { safeTransferFromData } from "./contract.transformed";
import { safeMint } from "./contract.transformed";
import { mint } from "./contract.transformed";
import { burn } from "./contract.transformed";
import { balanceOf } from "./contract.transformed";
import { ownerOf } from "./contract.transformed";
import { name } from "./contract.transformed";
import { symbol } from "./contract.transformed";
import { getApproved } from "./contract.transformed";
import { isApprovedForAll } from "./contract.transformed";
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

    if (selector == 0x095ea7b3) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    approve(arg0, arg1); return 0;
  }
  if (selector == 0xa22cb465) {
    const arg0 = position + 4;
    const arg1 = Boolean.toValue(position + 36);
    setApprovalForAll(arg0, arg1); return 0;
  }
  if (selector == 0x23b872dd) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    const arg2 = position + 68;
    transferFrom(arg0, arg1, arg2); return 0;
  }
  if (selector == 0x42842e0e) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    const arg2 = position + 68;
    safeTransferFrom(arg0, arg1, arg2); return 0;
  }
  if (selector == 0xec2bac21) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    const arg2 = position + 68;
    const arg3 = position + 100;
    safeTransferFromData(arg0, arg1, arg2, arg3); return 0;
  }
  if (selector == 0x8832e6e3) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    const arg2 = Str.fromDynamicArg(position + 4, position + 68);
    safeMint(arg0, arg1, arg2); return 0;
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
  if (selector == 0x70a08231) {
    const arg0 = position + 4;
    let ptr = balanceOf(arg0); write_result(ptr, 32); return 0;
  }
  if (selector == 0x6352211e) {
    const arg0 = position + 4;
    let ptr = ownerOf(arg0); write_result(ptr, 32); return 0;
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
  if (selector == 0x081812fc) {
    const arg0 = position + 4;
    let ptr = getApproved(arg0); write_result(ptr, 32); return 0;
  }
  if (selector == 0xe985e9c5) {
    const arg0 = position + 4;
    const arg1 = position + 36;
    let ptr = isApprovedForAll(arg0, arg1); write_result(ptr, 32); return 0;
  }
  if (selector == 0x71742007) {
    const arg0 = Str.fromDynamicArg(position + 4, position + 4);
    const arg1 = Str.fromDynamicArg(position + 4, position + 36);
    contract_constructor(arg0, arg1); return 0;
  }
  return 0;
}`

export const ERC721_CONTRACT_TRANSFORMED = `// eslint-disable-next-line import/namespace
import {
  storage_load_bytes32,
  storage_cache_bytes32,
  storage_flush_cache,
} from "as-stylus/core/modules/hostio";
import { createStorageKey } from "as-stylus/core/modules/storage";
import { abort_with_data } from "as-stylus/core/modules/errors";
import { addTopic, emitTopics } from "as-stylus/core/modules/events";
import { Mapping } from "as-stylus/core/types/mapping";
import { Mapping2 } from "as-stylus/core/types/mapping2";
import { Boolean } from "as-stylus/core/types/boolean";
import { Address } from "as-stylus/core/types/address";
import { U256 } from "as-stylus/core/types/u256";
import { I256 } from "as-stylus/core/types/i256";
import { Str } from "as-stylus/core/types/str";
import { loadU32BE } from "as-stylus/core/modules/endianness";
import { Struct } from "as-stylus/core/types/struct";
import { Msg } from "as-stylus/core/types/msg";
import { malloc } from "as-stylus/core/modules/memory";

const __SLOT01: u64 = 1;
const __SLOT02: u64 = 2;
const __SLOT03: u64 = 3;
const __SLOT04: u64 = 4;
const __SLOT05: u64 = 5;
function load_name(): usize {
  return Str.loadFrom(__SLOT05);
}

function store_name(strPtr: usize): void {
  Str.storeTo(__SLOT05, strPtr);
}
const __SLOT06: u64 = 6;
function load_symbol(): usize {
  return Str.loadFrom(__SLOT06);
}

function store_symbol(strPtr: usize): void {
  Str.storeTo(__SLOT06, strPtr);
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
  // Write argument 1: owner (Address)
  U256.copy(errorData + 4, arg0);
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
  // Write argument 1: tokenId (U256)
  U256.copy(errorData + 4, arg0);
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

export function __create_error_data_ERC721IncorrectOwner(arg0: usize, arg1: usize, arg2: usize): usize {
  const errorData: usize = malloc(100);
  __write_error_selector_ERC721IncorrectOwner(errorData); // Write selector
  // Write argument 1: sender (Address)
  U256.copy(errorData + 4, arg0);
  // Write argument 2: tokenId (U256)
  U256.copy(errorData + 36, arg1);
  // Write argument 3: owner (Address)
  U256.copy(errorData + 68, arg2);
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
  // Write argument 1: sender (Address)
  U256.copy(errorData + 4, arg0);
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
  // Write argument 1: receiver (Address)
  U256.copy(errorData + 4, arg0);
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
  // Write argument 1: sender (Address)
  U256.copy(errorData + 4, arg0);
  // Write argument 2: tokenId (U256)
  U256.copy(errorData + 36, arg1);
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
  // Write argument 1: approver (Address)
  U256.copy(errorData + 4, arg0);
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
  // Write argument 1: operator (Address)
  U256.copy(errorData + 4, arg0);
  return errorData;
}

export function contract_constructor(arg0: usize, arg1: usize): void {
  const _name = arg0;
  const _symbol = arg1;
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

export function approve(arg0: usize, arg1: usize): void {
  const to = arg0;
  const tokenId = arg1;
  const authorizer = Msg.sender();
  const owner = Mapping.getAddress(__SLOT01, tokenId);
  const isOwnerZero = Address.isZero(owner);
  if (isOwnerZero) {
    // Revert with custom error ERC721NonexistentToken
    const __errorData_2: usize = __create_error_data_ERC721NonexistentToken(tokenId);
    abort_with_data(__errorData_2, 36);
  }
  const isOwnerAuth = Address.equals(owner, authorizer);
  const isApprovedForAll = Boolean.toValue(Mapping2.getBoolean(__SLOT04, owner, authorizer));
  const isAuthorized = isOwnerAuth || isApprovedForAll;
  if (!isAuthorized) {
    // Revert with custom error ERC721InvalidApprover
    const __errorData_3: usize = __create_error_data_ERC721InvalidApprover(authorizer);
    abort_with_data(__errorData_3, 36);
  }
  Mapping.setAddress(__SLOT03, tokenId, to);
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
  Mapping2.setBoolean(__SLOT04, owner, operator, approved);
  // topic0 for ApprovalForAll
  const __topics_7: usize = malloc(96);
  __write_topic0_ApprovalForAll(__topics_7);
  addTopic(__topics_7 + 32, owner, 32);
  addTopic(__topics_7 + 64, operator, 32);
  const __data_8: usize = malloc(32);
  U256.copy(__data_8 + 0, approved);
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
  const __str_13: usize = malloc(1);
  store<u8>(__str_13 + 0, 49);
  const __len_14: u32 = 1;
  const __u256_12: usize = U256.create();
  U256.setFromString(__u256_12, __str_13, __len_14);
  const one = __u256_12;
  const isToZero = Address.isZero(to);
  if (isToZero) {
    // Revert with custom error ERC721InvalidReceiver
    const __errorData_15: usize = __create_error_data_ERC721InvalidReceiver(to);
    abort_with_data(__errorData_15, 36);
  }
  const owner = Mapping.getAddress(__SLOT01, tokenId);
  const authorizer = Msg.sender();
  const isOwnerZero = Address.isZero(owner);
  const approvedAddress = Mapping.getAddress(__SLOT03, tokenId);
  const isApprovedForAll = Boolean.toValue(Mapping2.getBoolean(__SLOT04, owner, authorizer));
  const isAuthOwner = Address.equals(authorizer, owner);
  const isAuthApproved = Address.equals(authorizer, approvedAddress);
  const isAuthorized = isAuthOwner || isAuthApproved || isApprovedForAll;
  if (!isAuthorized) {
    if (isOwnerZero) {
      // Revert with custom error ERC721NonexistentToken
      const __errorData_16: usize = __create_error_data_ERC721NonexistentToken(tokenId);
      abort_with_data(__errorData_16, 36);
    } else {
      // Revert with custom error ERC721InsufficientApproval
      const __errorData_17: usize = __create_error_data_ERC721InsufficientApproval(authorizer, tokenId);
      abort_with_data(__errorData_17, 68);
    }
  }
  const isFromOwner = Address.equals(owner, from);
  if (!isFromOwner) {
    // Revert with custom error ERC721IncorrectOwner
    const __errorData_18: usize = __create_error_data_ERC721IncorrectOwner(authorizer, tokenId, owner);
    abort_with_data(__errorData_18, 100);
  }
  const isFromZero = Address.isZero(owner);
  if (!isFromZero) {
    Mapping.setAddress(__SLOT03, tokenId, zeroAddress);
    const fromBalance = Mapping.getU256(__SLOT02, owner);
    Mapping.setU256(__SLOT02, owner, U256.sub(fromBalance, one));
  }
  if (!isToZero) {
    const toBalance = Mapping.getU256(__SLOT02, to);
    Mapping.setU256(__SLOT02, to, U256.add(toBalance, one));
  }
  Mapping.setAddress(__SLOT01, tokenId, to);
  // topic0 for Transfer
  const __topics_19: usize = malloc(128);
  __write_topic0_Transfer(__topics_19);
  addTopic(__topics_19 + 32, owner, 32);
  addTopic(__topics_19 + 64, to, 32);
  addTopic(__topics_19 + 96, tokenId, 32);
  const __data_20: usize = 0; // no data
  emitTopics(__topics_19, 4, __data_20, 0);
}
export function safeTransferFrom(arg0: usize, arg1: usize, arg2: usize): void {
  const _from = arg0;
  const _to = arg1;
  const _tokenId = arg2;

}
export function safeTransferFromData(arg0: usize, arg1: usize, arg2: usize, arg3: usize): void {
  const _from = arg0;
  const _to = arg1;
  const _tokenId = arg2;
  const _data = arg3;

}
export function safeMint(arg0: usize, arg1: usize, arg2: usize): void {
  const to = arg0;
  const tokenId = arg1;
  const _data = arg2;
  const __hexPtr_21: usize = malloc(42);
  store<u8>(__hexPtr_21 + 0, 48);
  store<u8>(__hexPtr_21 + 1, 120);
  store<u8>(__hexPtr_21 + 2, 48);
  store<u8>(__hexPtr_21 + 3, 48);
  store<u8>(__hexPtr_21 + 4, 48);
  store<u8>(__hexPtr_21 + 5, 48);
  store<u8>(__hexPtr_21 + 6, 48);
  store<u8>(__hexPtr_21 + 7, 48);
  store<u8>(__hexPtr_21 + 8, 48);
  store<u8>(__hexPtr_21 + 9, 48);
  store<u8>(__hexPtr_21 + 10, 48);
  store<u8>(__hexPtr_21 + 11, 48);
  store<u8>(__hexPtr_21 + 12, 48);
  store<u8>(__hexPtr_21 + 13, 48);
  store<u8>(__hexPtr_21 + 14, 48);
  store<u8>(__hexPtr_21 + 15, 48);
  store<u8>(__hexPtr_21 + 16, 48);
  store<u8>(__hexPtr_21 + 17, 48);
  store<u8>(__hexPtr_21 + 18, 48);
  store<u8>(__hexPtr_21 + 19, 48);
  store<u8>(__hexPtr_21 + 20, 48);
  store<u8>(__hexPtr_21 + 21, 48);
  store<u8>(__hexPtr_21 + 22, 48);
  store<u8>(__hexPtr_21 + 23, 48);
  store<u8>(__hexPtr_21 + 24, 48);
  store<u8>(__hexPtr_21 + 25, 48);
  store<u8>(__hexPtr_21 + 26, 48);
  store<u8>(__hexPtr_21 + 27, 48);
  store<u8>(__hexPtr_21 + 28, 48);
  store<u8>(__hexPtr_21 + 29, 48);
  store<u8>(__hexPtr_21 + 30, 48);
  store<u8>(__hexPtr_21 + 31, 48);
  store<u8>(__hexPtr_21 + 32, 48);
  store<u8>(__hexPtr_21 + 33, 48);
  store<u8>(__hexPtr_21 + 34, 48);
  store<u8>(__hexPtr_21 + 35, 48);
  store<u8>(__hexPtr_21 + 36, 48);
  store<u8>(__hexPtr_21 + 37, 48);
  store<u8>(__hexPtr_21 + 38, 48);
  store<u8>(__hexPtr_21 + 39, 48);
  store<u8>(__hexPtr_21 + 40, 48);
  store<u8>(__hexPtr_21 + 41, 48);
  const __hexLen_22: u32 = 42;
  const __addrPtr_23: usize = Address.create();
  Address.setFromStringHex(__addrPtr_23, __hexPtr_21, __hexLen_22);
  const zeroAddress = __addrPtr_23;
  const __str_25: usize = malloc(1);
  store<u8>(__str_25 + 0, 49);
  const __len_26: u32 = 1;
  const __u256_24: usize = U256.create();
  U256.setFromString(__u256_24, __str_25, __len_26);
  const one = __u256_24;
  const isToZero = Address.isZero(to);
  if (isToZero) {
    // Revert with custom error ERC721InvalidReceiver
    const __errorData_27: usize = __create_error_data_ERC721InvalidReceiver(zeroAddress);
    abort_with_data(__errorData_27, 36);
  }
  const from = Mapping.getAddress(__SLOT01, tokenId);
  const isFromZero = Address.isZero(from);
  if (!isFromZero) {
    Mapping.setAddress(__SLOT03, tokenId, zeroAddress);
    const fromBalance = Mapping.getU256(__SLOT02, from);
    Mapping.setU256(__SLOT02, from, U256.sub(fromBalance, one));
  }
  if (!isToZero) {
    const toBalance = Mapping.getU256(__SLOT02, to);
    Mapping.setU256(__SLOT02, to, U256.add(toBalance, one));
  }
  Mapping.setAddress(__SLOT01, tokenId, to);
  // topic0 for Transfer
  const __topics_28: usize = malloc(128);
  __write_topic0_Transfer(__topics_28);
  addTopic(__topics_28 + 32, from, 32);
  addTopic(__topics_28 + 64, to, 32);
  addTopic(__topics_28 + 96, tokenId, 32);
  const __data_29: usize = 0; // no data
  emitTopics(__topics_28, 4, __data_29, 0);
  if (!isFromZero) {
    // Revert with custom error ERC721InvalidSender
    const __errorData_30: usize = __create_error_data_ERC721InvalidSender(zeroAddress);
    abort_with_data(__errorData_30, 36);
  }
}
export function mint(arg0: usize, arg1: usize): void {
  const to = arg0;
  const tokenId = arg1;
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
  const __str_35: usize = malloc(1);
  store<u8>(__str_35 + 0, 49);
  const __len_36: u32 = 1;
  const __u256_34: usize = U256.create();
  U256.setFromString(__u256_34, __str_35, __len_36);
  const one = __u256_34;
  const isToZero = Address.isZero(to);
  if (isToZero) {
    // Revert with custom error ERC721InvalidReceiver
    const __errorData_37: usize = __create_error_data_ERC721InvalidReceiver(zeroAddress);
    abort_with_data(__errorData_37, 36);
  }
  const from = Mapping.getAddress(__SLOT01, tokenId);
  const isFromZero = Address.isZero(from);
  if (!isFromZero) {
    // Revert with custom error ERC721InvalidSender
    const __errorData_38: usize = __create_error_data_ERC721InvalidSender(zeroAddress);
    abort_with_data(__errorData_38, 36);
  }
  if (!isToZero) {
    const toBalance = Mapping.getU256(__SLOT02, to);
    Mapping.setU256(__SLOT02, to, U256.add(toBalance, one));
  }
  Mapping.setAddress(__SLOT01, tokenId, to);
  // topic0 for Transfer
  const __topics_39: usize = malloc(128);
  __write_topic0_Transfer(__topics_39);
  addTopic(__topics_39 + 32, from, 32);
  addTopic(__topics_39 + 64, to, 32);
  addTopic(__topics_39 + 96, tokenId, 32);
  const __data_40: usize = 0; // no data
  emitTopics(__topics_39, 4, __data_40, 0);
}
export function burn(arg0: usize): void {
  const tokenId = arg0;
  const __hexPtr_41: usize = malloc(42);
  store<u8>(__hexPtr_41 + 0, 48);
  store<u8>(__hexPtr_41 + 1, 120);
  store<u8>(__hexPtr_41 + 2, 48);
  store<u8>(__hexPtr_41 + 3, 48);
  store<u8>(__hexPtr_41 + 4, 48);
  store<u8>(__hexPtr_41 + 5, 48);
  store<u8>(__hexPtr_41 + 6, 48);
  store<u8>(__hexPtr_41 + 7, 48);
  store<u8>(__hexPtr_41 + 8, 48);
  store<u8>(__hexPtr_41 + 9, 48);
  store<u8>(__hexPtr_41 + 10, 48);
  store<u8>(__hexPtr_41 + 11, 48);
  store<u8>(__hexPtr_41 + 12, 48);
  store<u8>(__hexPtr_41 + 13, 48);
  store<u8>(__hexPtr_41 + 14, 48);
  store<u8>(__hexPtr_41 + 15, 48);
  store<u8>(__hexPtr_41 + 16, 48);
  store<u8>(__hexPtr_41 + 17, 48);
  store<u8>(__hexPtr_41 + 18, 48);
  store<u8>(__hexPtr_41 + 19, 48);
  store<u8>(__hexPtr_41 + 20, 48);
  store<u8>(__hexPtr_41 + 21, 48);
  store<u8>(__hexPtr_41 + 22, 48);
  store<u8>(__hexPtr_41 + 23, 48);
  store<u8>(__hexPtr_41 + 24, 48);
  store<u8>(__hexPtr_41 + 25, 48);
  store<u8>(__hexPtr_41 + 26, 48);
  store<u8>(__hexPtr_41 + 27, 48);
  store<u8>(__hexPtr_41 + 28, 48);
  store<u8>(__hexPtr_41 + 29, 48);
  store<u8>(__hexPtr_41 + 30, 48);
  store<u8>(__hexPtr_41 + 31, 48);
  store<u8>(__hexPtr_41 + 32, 48);
  store<u8>(__hexPtr_41 + 33, 48);
  store<u8>(__hexPtr_41 + 34, 48);
  store<u8>(__hexPtr_41 + 35, 48);
  store<u8>(__hexPtr_41 + 36, 48);
  store<u8>(__hexPtr_41 + 37, 48);
  store<u8>(__hexPtr_41 + 38, 48);
  store<u8>(__hexPtr_41 + 39, 48);
  store<u8>(__hexPtr_41 + 40, 48);
  store<u8>(__hexPtr_41 + 41, 48);
  const __hexLen_42: u32 = 42;
  const __addrPtr_43: usize = Address.create();
  Address.setFromStringHex(__addrPtr_43, __hexPtr_41, __hexLen_42);
  const zeroAddress = __addrPtr_43;
  const __str_45: usize = malloc(1);
  store<u8>(__str_45 + 0, 49);
  const __len_46: u32 = 1;
  const __u256_44: usize = U256.create();
  U256.setFromString(__u256_44, __str_45, __len_46);
  const one = __u256_44;
  const from = Mapping.getAddress(__SLOT01, tokenId);
  const isFromZero = Address.isZero(from);
  if (!isFromZero) {
    Mapping.setAddress(__SLOT03, tokenId, zeroAddress);
    const fromBalance = Mapping.getU256(__SLOT02, from);
    Mapping.setU256(__SLOT02, from, U256.sub(fromBalance, one));
  }
  Mapping.setAddress(__SLOT01, tokenId, zeroAddress);
  // topic0 for Transfer
  const __topics_47: usize = malloc(128);
  __write_topic0_Transfer(__topics_47);
  addTopic(__topics_47 + 32, from, 32);
  addTopic(__topics_47 + 64, zeroAddress, 32);
  addTopic(__topics_47 + 96, tokenId, 32);
  const __data_48: usize = 0; // no data
  emitTopics(__topics_47, 4, __data_48, 0);
  if (isFromZero) {
    // Revert with custom error ERC721NonexistentToken
    const __errorData_49: usize = __create_error_data_ERC721NonexistentToken(tokenId);
    abort_with_data(__errorData_49, 36);
  }
}
export function balanceOf(arg0: usize): usize {
  const owner = arg0;
  const isOwnerZero = Address.isZero(owner);
  if (isOwnerZero) {
    // Revert with custom error ERC721InvalidOwner
    const __errorData_50: usize = __create_error_data_ERC721InvalidOwner(owner);
    abort_with_data(__errorData_50, 36);
  }
  return Mapping.getU256(__SLOT02, owner);
}
export function ownerOf(arg0: usize): usize {
  const tokenId = arg0;
  const owner = Mapping.getAddress(__SLOT01, tokenId);
  const isZero = Address.isZero(owner);
  if (isZero) {
    // Revert with custom error ERC721NonexistentToken
    const __errorData_51: usize = __create_error_data_ERC721NonexistentToken(tokenId);
    abort_with_data(__errorData_51, 36);
  }
  return owner;
}
export function name(): usize {
  return Str.toABI(load_name());
}
export function symbol(): usize {
  return Str.toABI(load_symbol());
}
export function getApproved(arg0: usize): usize {
  const tokenId = arg0;
  const owner = Mapping.getAddress(__SLOT01, tokenId);
  const isZero = Address.isZero(owner);
  if (isZero) {
    // Revert with custom error ERC721NonexistentToken
    const __errorData_52: usize = __create_error_data_ERC721NonexistentToken(tokenId);
    abort_with_data(__errorData_52, 36);
  }
  return Mapping.getAddress(__SLOT03, tokenId);
}
export function isApprovedForAll(arg0: usize, arg1: usize): usize {
  const owner = arg0;
  const operator = arg1;
  return Mapping2.getBoolean(__SLOT04, owner, operator);
}`