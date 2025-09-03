/**
 * IERC721 interface for ERC721 NFT contracts
 */
export interface IERC721 {
  balanceOf(owner: string): string;
  ownerOf(tokenId: string): string;
  safeTransferFrom(from: string, to: string, tokenId: string): void;
  transferFrom(from: string, to: string, tokenId: string): void;
  approve(to: string, tokenId: string): void;
  setApprovalForAll(operator: string, approved: boolean): void;
  getApproved(tokenId: string): string;
  isApprovedForAll(owner: string, operator: string): boolean;
  name(): string;
  symbol(): string;
}