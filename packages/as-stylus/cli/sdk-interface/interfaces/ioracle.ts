/**
 * IOracle interface for price oracle contracts
 */
export interface IOracle {
  getPrice(asset: string): string;
  updatePrice(asset: string, price: string): void;
}