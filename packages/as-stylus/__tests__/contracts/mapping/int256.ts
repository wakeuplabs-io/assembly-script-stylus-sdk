import { Address, Contract, External, I256, Mapping, U256, View } from "@wakeuplabs/as-stylus";

@Contract
export class MappingInt256 {
  // Position ID to trader address (for tracking long/short positions)
  positionTraders: Mapping<I256, Address> = new Mapping<I256, Address>();

  // Position ID to position size (can be positive for long, negative for short)
  positionSizes: Mapping<I256, I256> = new Mapping<I256, I256>();

  // Position ID to collateral amount
  positionCollateral: Mapping<I256, U256> = new Mapping<I256, U256>();

  positionMetadata: Mapping<I256, I256> = new Mapping<I256, I256>();
  positionActive: Mapping<I256, boolean> = new Mapping<I256, boolean>();
  positionNames: Mapping<I256, string> = new Mapping<I256, string>();

  constructor() {}

  @External
  setPosition(
    positionId: I256,
    trader: Address,
    size: I256,
    collateral: U256,
    metadata: I256,
    active: boolean,
    name: string,
  ): void {
    this.positionTraders.set(positionId, trader);
    this.positionSizes.set(positionId, size);
    this.positionCollateral.set(positionId, collateral);
    this.positionMetadata.set(positionId, metadata);
    this.positionActive.set(positionId, active);
    this.positionNames.set(positionId, name);
  }

  @View
  getPositionTrader(positionId: I256): Address {
    return this.positionTraders.get(positionId);
  }

  @View
  getPositionSize(_positionId: I256): I256 {
    return this.positionSizes.get(_positionId);
  }

  @View
  getPositionCollateral(positionId: I256): U256 {
    return this.positionCollateral.get(positionId);
  }

  @View
  getPositionMetadata(_positionId: I256): I256 {
    return this.positionMetadata.get(_positionId);
  }
  @View
  getPositionActive(positionId: I256): boolean {
    return this.positionActive.get(positionId);
  }

  @View
  getPositionName(positionId: I256): string {
    return this.positionNames.get(positionId);
  }
}
