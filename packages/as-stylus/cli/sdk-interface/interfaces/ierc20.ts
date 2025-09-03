/**
 * IERC20 interface for ERC20 token contracts
 */
export interface IERC20 {
  totalSupply(): string;
  balanceOf(account: string): string;
  transfer(to: string, amount: string): boolean;
  allowance(owner: string, spender: string): string;
  approve(spender: string, amount: string): boolean;
  transferFrom(from: string, to: string, amount: string): boolean;
  name(): string;
  symbol(): string;
  decimals(): number;
}