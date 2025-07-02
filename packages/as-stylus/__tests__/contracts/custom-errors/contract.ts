/* eslint-disable no-global-assign */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Error
export class ERC721InvalidOwner {
  owner: Address;
}
@Error
export class ERC721NonexistentToken {
  tokenId: U256;
}
@Error
export class ERC721IncorrectOwner {
  sender: Address;
  tokenId: U256;
  owner: Address;
}
@Error
export class ERC721InvalidSender {
  sender: Address;
}
@Error
export class ERC721InvalidReceiver {
  receiver: Address;
}
@Error
export class ERC721InsufficientApproval {
  operator: Address;
  tokenId: U256;
}
@Error
export class ERC721InvalidApprover {
  approver: Address;
}
@Error
export class ERC721InvalidOperator {
  operator: Address;
}

@Contract
export class RevertContract721 {
  static ZERO: Address;
  static ONE: U256;
  static TWO: U256;

  constructor() {
    const ONEMemory = U256Factory.fromString("1");
    const TWOMemory = U256Factory.fromString("2");
    ONE = ONEMemory;
    TWO = TWOMemory;
  }

  @External
  static errInvalidOwner(): void {
    ERC721InvalidOwner.revert(ZERO);
  }

  @External
  static errNonexistentToken(): void {
    ERC721NonexistentToken.revert(ONE);
  }

  @External
  static errIncorrectOwner(): void {
    const sender = msg.sender;
    ERC721IncorrectOwner.revert(sender, TWO, ZERO);
  }

  @External
  static errInvalidSender(): void {
    const sender = msg.sender;
    ERC721InvalidSender.revert(sender);
  }

  @External
  static errInvalidReceiver(): void {
    ERC721InvalidReceiver.revert(ZERO);
  }

  @External
  static errInsufficientApproval(): void {
    const sender = msg.sender;
    ERC721InsufficientApproval.revert(sender, ONE);
  }

  @External
  static errInvalidApprover(): void {
    const sender = msg.sender;
    ERC721InvalidApprover.revert(sender);
  }

  @External
  static errInvalidOperator(): void {
    const sender = msg.sender;
    ERC721InvalidOperator.revert(sender);
  }
}
