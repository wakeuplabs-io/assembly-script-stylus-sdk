import {
  Address,
  Contract,
  External,
  I256,
  I256Factory,
  Mapping,
  U256,
  View,
} from "@wakeuplabs/as-stylus";

@Contract
export class MappingUint256 {
  // Token ID to owner address (like NFT ownership)
  tokenOwners: Mapping<U256, Address> = new Mapping<U256, Address>();

  // Token ID to price/value
  tokenPrices: Mapping<U256, U256> = new Mapping<U256, U256>();

  // Token ID to approved address (like NFT approvals)
  tokenApprovals: Mapping<U256, Address> = new Mapping<U256, Address>();

  //tokenMetadata: Mapping<U256, I256> = new Mapping<U256, I256>();
  //tokenActive: Mapping<U256, boolean> = new Mapping<U256, boolean>();

  constructor() {}

  @External
  setToken(
    tokenId: U256,
    owner: Address,
    price: U256,
    approvedAddress: Address,
    _metadata: I256,
    _active: boolean,
  ): void {
    this.tokenOwners.set(tokenId, owner);
    this.tokenPrices.set(tokenId, price);
    this.tokenApprovals.set(tokenId, approvedAddress);
    //this.tokenMetadata.set(tokenId, metadata);
    //this.tokenActive.set(tokenId, active);
  }

  @View
  getTokenOwner(tokenId: U256): Address {
    return this.tokenOwners.get(tokenId);
  }

  @View
  getTokenPrice(tokenId: U256): U256 {
    return this.tokenPrices.get(tokenId);
  }

  @View
  getTokenApproval(tokenId: U256): Address {
    return this.tokenApprovals.get(tokenId);
  }

  @View
  getTokenMetadata(_tokenId: U256): I256 {
    //return this.tokenMetadata.get(tokenId);
    return I256Factory.fromString("10");
  }

  @View
  getTokenActive(_tokenId: U256): boolean {
    //return this.tokenActive.get(tokenId);
    return true;
  }
}
