import {
  Address,
  AddressFactory,
  Contract,
  ErrorFactory,
  EventFactory,
  External,
  msg,
  U256,
  U256Factory,
  View,
} from "@wakeuplabs/as-stylus";

const OwnableZeroAddress = ErrorFactory.create<[address: Address]>();
const OwnableNotOwner = ErrorFactory.create<[sender: Address, owner: Address]>();
const addressZero = AddressFactory.create();

const OwnershipTransferred = EventFactory.create<[previousOwner: Address, newOwner: Address]>({
  indexed: [true, true],
});

@Contract
export class Ownable {
  owner: Address;
  constructor() {
    this.owner = msg.sender;
  }

  @External
  transferOwnership(newOwner: Address): void {
    if (newOwner.isZero()) {
      OwnableZeroAddress.revert(newOwner);
    }
    if (!msg.sender.equals(this.owner)) {
      OwnableNotOwner.revert(msg.sender, this.owner);
    }
    this.owner = newOwner;
  }

  @External
  renounceOwnership(): void {
    if (!msg.sender.equals(this.owner)) {
      OwnableNotOwner.revert(msg.sender, this.owner);
    }
    this.owner = addressZero;
    OwnershipTransferred.emit(this.owner, addressZero);
  }

  @View
  onlyOwner(): void {
    if (!msg.sender.equals(this.owner)) {
      OwnableNotOwner.revert(msg.sender, this.owner);
    }
  }

  @View
  getOwner(): Address {
    return this.owner;
  }

  @View
  isOwner(address: Address): boolean {
    return address.equals(this.owner);
  }

  @View
  getValue(): U256 {
    this.onlyOwner();
    return U256Factory.fromString("1");
  }
}
