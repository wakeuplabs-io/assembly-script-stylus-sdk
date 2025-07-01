/* eslint-disable no-global-assign */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

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

  // ===== EXTERNAL FUNCTIONS =====

  @External
  static approve(to: Address, tokenId: U256): void {
    const owner = owners.get(tokenId);
    const sender = msg.sender;

    if (owner == sender || operatorApprovals.get(owner, sender)) {
      tokenApprovals.set(tokenId, to);
      Approval.emit(owner, to, tokenId);
    }
  }

  @External
  static setApprovalForAll(operator: Address, approved: boolean): void {
    const owner = msg.sender;
    operatorApprovals.set(owner, operator, approved);
    ApprovalForAll.emit(owner, operator, approved);
  }

  @External
  static transferFrom(from: Address, to: Address, tokenId: U256): void {
    const sender = msg.sender;
    const owner = owners.get(tokenId);
    const approved = tokenApprovals.get(tokenId);
    const isApprovedForAll = operatorApprovals.get(owner, sender);

    if (sender == owner || sender == approved || isApprovedForAll) {
      _transfer(from, to, tokenId);
    }
  }

  @External
  static safeTransferFrom(from: Address, to: Address, tokenId: U256): void {
    transferFrom(from, to, tokenId);
  }

  @External
  static safeTransferFrom(from: Address, to: Address, tokenId: U256, data: Bytes): void {
    const sender = msg.sender;
    transferFrom(from, to, tokenId);
    checkOnERC721Received(sender, from, to, tokenId, data);
  }

  @External
  static mint(to: Address, tokenId: U256): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");

    // Set owner
    owners.set(tokenId, to);

    // Update balance
    const balance = balances.get(to);
    balances.set(to, balance.add(U256Factory.fromString("1")));

    Transfer.emit(zeroAddress, to, tokenId);
  }

  @External
  static burn(tokenId: U256): void {
    const owner = owners.get(tokenId);
    const sender = msg.sender;
    const approved = tokenApprovals.get(tokenId);
    const isApprovedForAll = operatorApprovals.get(owner, sender);
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");

    if (sender == owner || sender == approved || isApprovedForAll) {
      // Clear approval
      tokenApprovals.set(tokenId, zeroAddress);

      // Update balance
      const balance = balances.get(owner);
      balances.set(owner, balance.sub(U256Factory.fromString("1")));

      // Remove owner
      owners.set(tokenId, zeroAddress);

      Transfer.emit(owner, zeroAddress, tokenId);
    }
  }

  // ===== INTERNAL FUNCTIONS =====

  static _transfer(from: Address, to: Address, tokenId: U256): void {
    // Clear previous approval
    tokenApprovals.set(
      tokenId,
      AddressFactory.fromString("0x0000000000000000000000000000000000000000"),
    );

    // Update balances
    const fromBalance = balances.get(from);
    const toBalance = balances.get(to);

    balances.set(from, fromBalance.sub(U256Factory.fromString("1")));
    balances.set(to, toBalance.add(U256Factory.fromString("1")));

    // Update owner
    owners.set(tokenId, to);

    Transfer.emit(from, to, tokenId);
  }

  static _exists(tokenId: U256): boolean {
    const owner = owners.get(tokenId);
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    return owner != zeroAddress;
  }

  static _checkOnERC721Received(
    sender: Address,
    from: Address,
    to: Address,
    tokenId: U256,
    data: Bytes,
  ): void {
    const onERC721Received = to.call("onERC721Received", [sender, from, tokenId, data]);
    if (onERC721Received != "0x150b7a02") {
      revert("ERC721: transfer to non ERC721Receiver implementer");
    }
  }

  // ===== VIEW FUNCTIONS =====

  @View
  static balanceOf(owner: Address): U256 {
    return balances.get(owner);
  }

  @View
  static ownerOf(tokenId: U256): Address {
    const owner = owners.get(tokenId);
    return owner;
  }

  @View
  static getApproved(tokenId: U256): Address {
    return tokenApprovals.get(tokenId);
  }

  @View
  static isApprovedForAll(owner: Address, operator: Address): boolean {
    return operatorApprovals.get(owner, operator);
  }
}
