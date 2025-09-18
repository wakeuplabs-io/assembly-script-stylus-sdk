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
} from "as-stylus";

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
