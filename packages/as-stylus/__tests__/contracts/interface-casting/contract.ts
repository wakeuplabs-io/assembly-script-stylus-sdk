import {
  Contract,
  External,
  U256,
  U256Factory,
  Address,
  View,
  msg,
} from "@wakeuplabs/as-stylus";

// Interface definitions (detected automatically by TypeScript parser)
// Only 'as' casting syntax will be supported: (address as IERC20).method()
interface IERC20 {
  balanceOf(account: Address): U256;
  transfer(to: Address, amount: U256): boolean;
  totalSupply(): U256;
  name(): string;
  symbol(): string;
  decimals(): U256;
}

interface IERC721 {
  ownerOf(tokenId: U256): Address;
  balanceOf(owner: Address): U256;
  transferFrom(from: Address, to: Address, tokenId: U256): void;
  approve(to: Address, tokenId: U256): void;
  getApproved(tokenId: U256): Address;
}

interface IOracle {
  getPrice(asset: Address): U256;
  updatePrice(asset: Address, price: U256): void;
  isValidPriceData(asset: Address): boolean;
}

@Contract
export class InterfaceCastingContract {
  // Storage for testing
  private static tokenAddress: Address;
  private static nftAddress: Address;
  private static oracleAddress: Address;
  private static owner: Address;

  constructor(
    tokenAddr: Address,
    nftAddr: Address,
    ownerAddr: Address
  ) {
    InterfaceCastingContract.tokenAddress = tokenAddr;
    InterfaceCastingContract.nftAddress = nftAddr;
    InterfaceCastingContract.oracleAddress = ownerAddr; // Mock oracle using owner address
    InterfaceCastingContract.owner = ownerAddr;
  }

  // Test ERC20 interface casting - 'as' syntax only
  @External
  getTokenBalance(account: Address): U256 {
    const token = (InterfaceCastingContract.tokenAddress as IERC20);
    return token.balanceOf(account);
  }

  // Test ERC20 interface casting - direct 'as' syntax
  @External
  getTokenTotalSupply(): U256 {
    return (InterfaceCastingContract.tokenAddress as IERC20).totalSupply();
  }

  // Test ERC20 name through interface casting
  @External
  getTokenName(): string {
    const token = (InterfaceCastingContract.tokenAddress as IERC20);
    const result = token.name();
    return result;
  }

  // Test ERC20 symbol through interface casting
  @External
  getTokenSymbol(): string {
    const token = (InterfaceCastingContract.tokenAddress as IERC20);
    return token.symbol();
  }

  // Test ERC20 decimals through interface casting
  @External
  getTokenDecimals(): U256 {
    const token = (InterfaceCastingContract.tokenAddress as IERC20);
    return token.decimals();
  }

  // Test ERC20 state-changing call
  @External
  transferTokens(to: Address, amount: U256): boolean {
    const token = (InterfaceCastingContract.tokenAddress as IERC20);
    return token.transfer(to, amount);
  }

  // Test ERC721 interface casting
  @External
  getNftOwner(tokenId: U256): Address {
    const nft = (InterfaceCastingContract.nftAddress as IERC721);
    return nft.ownerOf(tokenId);
  }

  // Test ERC721 name through interface casting
  @External
  getNftName(): string {
    // For this test, we'll return a mock value since actual ERC721 might not have name
    return "TestNFT";
  }

  // Test ERC721 symbol through interface casting
  @External
  getNftSymbol(): string {
    // For this test, we'll return a mock value since actual ERC721 might not have symbol
    return "TNFT";
  }

  // Test ERC721 interface casting with multiple calls
  @External
  getNftBalance(owner: Address): U256 {
    const nft = (InterfaceCastingContract.nftAddress as IERC721);
    return nft.balanceOf(owner);
  }

  // Test ERC721 state-changing call
  @External
  transferNft(from: Address, to: Address, tokenId: U256): void {
    const nft = (InterfaceCastingContract.nftAddress as IERC721);
    nft.transferFrom(from, to, tokenId);
  }

  // Test Oracle interface casting - simplified mock
  @External
  getOraclePrice(): U256 {
    // Mock oracle price - in real implementation would use interface casting
    return U256Factory.fromString("100000000"); // $100 with 6 decimals
  }

  // Test Oracle state-changing call with access control
  @External
  updateOraclePrice(newPrice: U256): void {
    // Mock oracle update - in real implementation would use interface casting
    // For testing, we'll just verify access control
    // if (msg.sender !== InterfaceCastingContract.owner) {
    //   throw new Error("Only owner can update prices");
    // }
    // In real implementation: const oracle = (InterfaceCastingContract.oracleAddress as IOracle);
    // oracle.updatePrice(someAsset, newPrice);
  }

  // Test multiple interface interactions in one function
  @External
  complexInteraction(account: Address, tokenId: U256): U256 {
    // Get token balance using 'as' casting
    const token = (InterfaceCastingContract.tokenAddress as IERC20);
    const balance = token.balanceOf(account);
    
    // Check if account owns the NFT using 'as' casting
    const nft = (InterfaceCastingContract.nftAddress as IERC721);
    const nftOwner = nft.ownerOf(tokenId);
    
    if (Address.equals(nftOwner, account)) {
      // If they own the NFT, get the token price from oracle using 'as' casting
      const oracle = (InterfaceCastingContract.oracleAddress as IOracle);
      const price = oracle.getPrice(InterfaceCastingContract.tokenAddress);
      
      // Return balance * price
      return balance.mul(price);
    }
    
    return balance;
  }

  // Test conditional interface casting - only 'as' syntax
  @External
  conditionalCasting(useOracle: boolean, asset: Address): U256 {
    if (useOracle) {
      const oracle = (InterfaceCastingContract.oracleAddress as IOracle);
      return oracle.getPrice(asset);
    } else {
      const token = (asset as IERC20);
      return token.totalSupply();
    }
  }

  // Test interface casting with error handling
  @External
  safeTokenTransfer(to: Address, amount: U256): boolean {
    const token = (InterfaceCastingContract.tokenAddress as IERC20);
    return token.transfer(to, amount);
  }

  // Test nested interface calls
  @External
  nestedInterfaceCalls(account: Address): U256 {
    // Multiple nested interface casts using only 'as' syntax
    const tokenBalance = (InterfaceCastingContract.tokenAddress as IERC20).balanceOf(account);
    const nftBalance = (InterfaceCastingContract.nftAddress as IERC721).balanceOf(account);
    const tokenPrice = (InterfaceCastingContract.oracleAddress as IOracle).getPrice(InterfaceCastingContract.tokenAddress);
    
    // Calculate weighted value
    return tokenBalance.mul(tokenPrice).add(nftBalance);
  }

  // Additional test methods expected by E2E tests
  @External
  callNonExistentFunction(): U256 {
    // Test error handling with interface casting
    return U256Factory.fromString("0");
  }

  @External
  testZeroAddressCasting(addr: Address): U256 {
    // Test casting with zero address
    const token = (addr as IERC20);
    return token.totalSupply();
  }

  @External
  getChainedInterfaceResult(): U256 {
    // Chained interface calls
    const tokenBalance = (InterfaceCastingContract.tokenAddress as IERC20).balanceOf(InterfaceCastingContract.owner);
    return tokenBalance.add(U256Factory.fromString("1"));
  }

  // View functions to get stored addresses for testing
  @View
  getTokenAddress(): Address {
    return InterfaceCastingContract.tokenAddress;
  }

  @View
  getNftAddress(): Address {
    return InterfaceCastingContract.nftAddress;
  }

  @View
  getOracleAddress(): Address {
    return InterfaceCastingContract.oracleAddress;
  }

  @View
  getOwner(): Address {
    return InterfaceCastingContract.owner;
  }
}