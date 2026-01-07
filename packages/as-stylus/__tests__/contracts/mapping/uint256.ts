import {
  Address,
  U256Factory,
  Contract,
  External,
  I256,
  Mapping,
  U256,
  View,
  Str,
} from "@wakeuplabs/as-stylus";

@Contract
export class MappingUint256 {
  // Token ID to owner address (like NFT ownership)
  tokenOwners: Mapping<U256, Address> = new Mapping<U256, Address>();

  // Token ID to price/value
  tokenPrices: Mapping<U256, U256> = new Mapping<U256, U256>();

  // Token ID to approved address (like NFT approvals)
  tokenApprovals: Mapping<U256, Address> = new Mapping<U256, Address>();

  tokenMetadata: Mapping<U256, I256> = new Mapping<U256, I256>();
  tokenActive: Mapping<U256, boolean> = new Mapping<U256, boolean>();
  tokenNames: Mapping<U256, Str> = new Mapping<U256, Str>();

  constructor() {}

  @External
  setToken(
    tokenId: U256,
    owner: Address,
    price: U256,
    approvedAddress: Address,
    _metadata: I256,
    active: boolean,
    name: Str,
  ): void {
    this.tokenOwners.set(tokenId, owner);
    this.tokenPrices.set(tokenId, price);
    this.tokenApprovals.set(tokenId, approvedAddress);
    this.tokenMetadata.set(tokenId, _metadata);
    this.tokenActive.set(tokenId, active);
    this.tokenNames.set(tokenId, name);
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
    return this.tokenMetadata.get(_tokenId);
  }

  @View
  getTokenActive(tokenId: U256): boolean {
    return this.tokenActive.get(tokenId);
  }

  @View
  getTokenName(tokenId: U256): Str {
    return this.tokenNames.get(tokenId);
  }

  @External
  incrementTokenPrice(tokenId: U256): void {
    const price = this.tokenPrices.get(tokenId);
    this.tokenPrices.set(tokenId, price.add(U256Factory.fromString("1")));
  }
}
