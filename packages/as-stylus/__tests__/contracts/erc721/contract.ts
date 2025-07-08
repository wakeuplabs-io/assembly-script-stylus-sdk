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

// Variables para name y symbol
const name: string = "MyNFT";
const symbol: string = "MNFT";

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
  static operatorApprovals: Mapping2<Address, Address, boolean> = new Mapping2<
    Address,
    Address,
    boolean
  >();
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
    const auth = msg.sender;

    // Unwrapping _approve(to, tokenId, auth, true)
    // Since emitEvent is true and auth is not address(0), we need to verify the owner

    // Unwrapping _requireOwned(tokenId)
    const owner = owners.get(tokenId);
    const isOwnerZero = owner.isZero();
    if (isOwnerZero) {
      ERC721NonexistentToken.revert(tokenId);
    }

    // Authorization check for approval (exact Solidity logic)
    const isAuthZero = auth.isZero();
    if (!isAuthZero) {
      const isOwnerAuth = owner.equals(auth);
      if (!isOwnerAuth) {
        const isApprovedForAll = operatorApprovals.get(owner, auth);
        if (!isApprovedForAll) {
          ERC721InvalidApprover.revert(auth);
        }
      }
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

    // _update
    const owner = owners.get(tokenId);
    const auth = msg.sender;

    // _checkAuthorized
    const isOwnerZero = owner.isZero();
    const isAuthZero = auth.isZero();
    if (!isAuthZero) {
      const approvedAddress = tokenApprovals.get(tokenId);
      const isApprovedForAll = operatorApprovals.get(owner, auth);
      const isAuthOwner = auth.equals(owner);
      const isAuthApproved = auth.equals(approvedAddress);
      const isAuthorized = isAuthOwner || isAuthApproved || isApprovedForAll;

      if (!isAuthorized) {
        if (isOwnerZero) {
          ERC721NonexistentToken.revert(tokenId);
        } else {
          ERC721InsufficientApproval.revert(auth, tokenId);
        }
      }
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

    // transferFrom final validation
    const isFromOwner = owner.equals(from);
    if (!isFromOwner) {
      ERC721IncorrectOwner.revert(auth, tokenId, owner);
    }
  }

  @External
  static safeTransferFrom(_from: Address, _to: Address, _tokenId: U256): void {
    //TODO: Implement safeTransferFrom
  }

  @External
  static safeTransferFromData(_from: Address, _to: Address, _tokenId: U256, _data: U256): void {
    //TODO: Implement safeTransferFrom
  }

  @External
  static safeMint(to: Address, tokenId: U256, _data: Bytes): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    const one = U256Factory.fromString("1");

    // _mint validations
    const isToZero = to.isZero();
    if (isToZero) {
      ERC721InvalidReceiver.revert(zeroAddress);
    }

    // _update
    const from = owners.get(tokenId);

    // Como auth es address(0), no hacemos _checkAuthorized

    const isFromZero = from.isZero();
    if (!isFromZero) {
      tokenApprovals.set(tokenId, zeroAddress);
      const fromBalance = balances.get(from);
      balances.set(from, fromBalance.sub(one));
    }

    if (!isToZero) {
      const toBalance = balances.get(to);
      balances.set(to, toBalance.add(one));
    }

    owners.set(tokenId, to);
    Transfer.emit(from, to, tokenId);

    // _mint final validation
    if (!isFromZero) {
      ERC721InvalidSender.revert(zeroAddress);
    }

    // Safe mint check: if 'to' is a contract, it must implement onERC721Received
    // const isContract = to.hasCode();
    // if (isContract) {
    // TODO: Call onERC721Received - requires interface implementation
    // For now, we assume the contract implements the interface correctly
    //Implementacion Proposed: TODO: Contract.call
    /* -------------------- build calldata -------------------- */
    // const selector = BytesFactory.fromHex("0x150b7a02"); // onERC721Received
    // const operator = msg.sender; // quien mintéa
    // const fromZero = zeroAddress; // Address.ZERO
    // // abi.encode(selector, operator, from, tokenId, data)
    // const callData = Abi.encode(
    //   selector,
    //   operator,
    //   fromZero, // 'from' es address(0) en un mint
    //   tokenId,
    //   _data,
    // );
    // /* -------------------- low-level call -------------------- */
    // const retData = Contract.call(to, callData);
    // /* -------------------- validar magic value -------------------- */
    // const okMagic = retData.equals(selector);
    // if (!okMagic) {
    //   ERC721InvalidReceiver.revert(to);
    // }
    // }
  }

  @External
  static mint(to: Address, tokenId: U256): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    const one = U256Factory.fromString("1");

    // _mint validations
    const isToZero = to.isZero();
    if (isToZero) {
      ERC721InvalidReceiver.revert(zeroAddress);
    }

    // _update
    const from = owners.get(tokenId);

    const isFromZero = from.isZero();
    if (!isFromZero) {
      tokenApprovals.set(tokenId, zeroAddress);
      const fromBalance = balances.get(from);
      balances.set(from, fromBalance.sub(one));
    }

    if (!isToZero) {
      const toBalance = balances.get(to);
      balances.set(to, toBalance.add(one));
    }

    owners.set(tokenId, to);
    Transfer.emit(from, to, tokenId);

    // _mint final validation
    if (!isFromZero) {
      ERC721InvalidSender.revert(zeroAddress);
    }
  }

  @External
  static burn(tokenId: U256): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    const one = U256Factory.fromString("1");

    // _update
    const from = owners.get(tokenId);

    const isFromZero = from.isZero();
    if (!isFromZero) {
      tokenApprovals.set(tokenId, zeroAddress);
      const fromBalance = balances.get(from);
      balances.set(from, fromBalance.sub(one));
    }

    owners.set(tokenId, zeroAddress);
    Transfer.emit(from, zeroAddress, tokenId);

    // _burn final validation
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
    //_requireOwned
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
