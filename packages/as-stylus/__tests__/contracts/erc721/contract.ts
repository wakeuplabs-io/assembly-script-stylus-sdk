/* eslint-disable no-global-assign */
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
  static owners: Mapping<U256, Address>;
  static balances: Mapping<Address, U256>;
  static tokenApprovals: Mapping<U256, Address>;
  static operatorApprovals: MappingNested<Address, Address, boolean>;
  static name: Str;
  static symbol: Str;

  constructor(_name: string, _symbol: string) {
    const nameStr = StrFactory.fromString(_name);
    const symbolStr = StrFactory.fromString(_symbol);
    name = nameStr;
    symbol = symbolStr;
  }


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

    // transferFrom validations
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
      const fromBalance: U256 = balances.get(owner);
      balances.set(owner, fromBalance.sub(U256Factory.fromString("1")));
    }

    if (!isToZero) {
      const toBalance: U256 = balances.get(to);
      balances.set(to, toBalance.add(U256Factory.fromString("1")));
    }

    owners.set(tokenId, to);
    Transfer.emit(owner, to, tokenId);
  }

  @External
  static mint(to: Address, tokenId: U256): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");

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
      balances.set(to, toBalance.add(U256Factory.fromString("1")));
    }

    owners.set(tokenId, to);
    Transfer.emit(from, to, tokenId);
  }

  @External
  static burn(tokenId: U256): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");

    const from = owners.get(tokenId);

    const isFromZero = from.isZero();
    if (!isFromZero) {
      tokenApprovals.set(tokenId, zeroAddress);
      const fromBalance = balances.get(from);
      balances.set(from, fromBalance.sub(U256Factory.fromString("1")));
    }

    owners.set(tokenId, zeroAddress);
    Transfer.emit(from, zeroAddress, tokenId);

    if (isFromZero) {
      ERC721NonexistentToken.revert(tokenId);
    }
  }

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
    const isZero = owners.get(tokenId).isZero();
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
}
