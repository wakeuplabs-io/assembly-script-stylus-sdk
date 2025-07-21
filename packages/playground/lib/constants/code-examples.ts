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
import { Contract } from './contract'

export function user_entrypoint(selector: u32): void {
  const contract = new Contract()
  
  switch (selector) {
    case 0x06fdde03: // name()
      contract.name()
      break
    case 0x70a08231: // balanceOf(address)
      contract.balanceOf()
      break
    case 0xa9059cbb: // transfer(address,uint256)
      contract.transfer()
      break
    default:
      throw new Error('Unknown selector')
  }
}`

export const SELECTORS_CODE = `{
  "name": "0x06fdde03",
  "symbol": "0x95d89b41", 
  "balanceOf": "0x70a08231",
  "transfer": "0xa9059cbb",
  "approve": "0x095ea7b3"
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