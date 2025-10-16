import {
  Address,
  Contract,
  External,
  I256,
  I256Factory,
  Mapping,
  U256,
  U256Factory,
  View,
} from "@wakeuplabs/as-stylus";

@Contract
export class MappingInt256 {
  // Position ID to trader address (for tracking long/short positions)
  positionTraders: Mapping<I256, Address> = new Mapping<I256, Address>();

  // Position ID to position size (can be positive for long, negative for short)
  //positionSizes: Mapping<I256, I256> = new Mapping<I256, I256>();

  // Position ID to collateral amount
  positionCollateral: Mapping<I256, U256> = new Mapping<I256, U256>();

  //positionMetadata: Mapping<I256, I256> = new Mapping<I256, I256>();
  //positionActive: Mapping<I256, boolean> = new Mapping<I256, boolean>();

  constructor() {}

  @External
  setPosition(
    positionId: I256,
    trader: Address,
    size: I256,
    collateral: U256,
    metadata: I256,
    active: boolean,
  ): void {
    this.positionTraders.set(positionId, trader);
    //this.positionSizes.set(positionId, size);
    this.positionCollateral.set(positionId, collateral);
    //this.positionMetadata.set(positionId, metadata);
    //this.positionActive.set(positionId, active);
  }

  @View
  getPositionTrader(positionId: I256): Address {
    return this.positionTraders.get(positionId);
  }

  @View
  getPositionSize(_positionId: I256): I256 {
    //return this.positionSizes.get(positionId);
    return I256Factory.fromString("-500");
  }

  @View
  getPositionCollateral(positionId: I256): U256 {
    return this.positionCollateral.get(positionId);
    return U256Factory.fromString("10000");
  }

  @View
  getPositionMetadata(_positionId: I256): I256 {
    //return this.positionMetadata.get(positionId);
    return I256Factory.fromString("10");
  }
  @View
  getPositionActive(_positionId: I256): boolean {
    //return this.positionActive.get(positionId);
    return true;
  }
}
