import {
  Address,
  AddressFactory,
  Contract,
  ErrorFactory,
  External,
  U256,
  U256Factory,
  msg,
} from "@wakeuplabs/as-stylus";

const ERC721InvalidOwner = ErrorFactory.create<[owner: Address]>();
const ERC721NonexistentToken = ErrorFactory.create<[tokenId: U256]>();
const ERC721IncorrectOwner =
  ErrorFactory.create<[owner: Address, tokenId: U256, operator: Address]>();
const ERC721InvalidSender = ErrorFactory.create<[sender: Address]>();
const ERC721InvalidReceiver = ErrorFactory.create<[receiver: Address]>();
const ERC721InsufficientApproval = ErrorFactory.create<[approver: Address, tokenId: U256]>();
const ERC721InvalidApprover = ErrorFactory.create<[approver: Address]>();
const ERC721InvalidOperator = ErrorFactory.create<[operator: Address]>();

@Contract
export class RevertContract721 {
  ZERO: Address;
  ONE: U256;
  TWO: U256;

  constructor() {
    this.ZERO = AddressFactory.create();
    this.ONE = U256Factory.fromString("1");
    this.TWO = U256Factory.fromString("2");
  }

  @External
  errInvalidOwner(): void {
    ERC721InvalidOwner.revert(this.ZERO);
  }

  @External
  errNonexistentToken(): void {
    ERC721NonexistentToken.revert(this.ONE);
  }

  @External
  errIncorrectOwner(): void {
    const sender = msg.sender;
    ERC721IncorrectOwner.revert(sender, this.TWO, this.ZERO);
  }

  @External
  errInvalidSender(): void {
    const sender = msg.sender;
    ERC721InvalidSender.revert(sender);
  }

  @External
  errInvalidReceiver(): void {
    ERC721InvalidReceiver.revert(this.ZERO);
  }

  @External
  errInsufficientApproval(): void {
    const sender = msg.sender;
    ERC721InsufficientApproval.revert(sender, this.ONE);
  }

  @External
  errInvalidApprover(): void {
    const sender = msg.sender;
    ERC721InvalidApprover.revert(sender);
  }

  @External
  errInvalidOperator(): void {
    const sender = msg.sender;
    ERC721InvalidOperator.revert(sender);
  }
}
