import { Address, Hash, ReadContractReturnType, WalletClient, WriteContractReturnType } from "viem";

export type ContractArgs = (
  | string
  | boolean
  | Address
  | bigint
  | (string | boolean | Address | bigint)[]
)[];

export type ContractError = {
  name: string;
  args: unknown[];
};

export type ReadRawResult<T = unknown> =
  | { success: true; returnData: T }
  | { success: false; error: ContractError };

export type WriteRawResult =
  | { success: true; txHash: Hash }
  | { success: false; error: ContractError };

export enum ChainId {
  ArbitrumSepolia = 421614,
  LocalArbitrumSepolia = 412346,
  ArbitrumOne = 42161,
}

export interface ContractService {
  address: Address;
  /**
   * Writes to the contract
   * @param walletClient - Wallet client to use for the write operation (must be funded)
   * @param functionName - Name of the function to call
   * @param args - Arguments to pass to the function
   * @param value - Value to send with the write operation
   * @param nonce - Nonce to use for the write operation
   * @returns - Transaction hash
   */
  write: (
    walletClient: WalletClient,
    functionName: string,
    args: ContractArgs,
    value?: bigint,
    nonce?: number,
  ) => Promise<WriteContractReturnType>;
  /**
   * Reads from the contract
   * @param functionName - Name of the function to call
   * @param args - Arguments to pass to the function
   * @param gasLimit - Gas limit to use for the read operation
   * @returns - Decoded result of the function call
   */
  read: (
    functionName: string,
    args: ContractArgs,
    gasLimit?: bigint,
  ) => Promise<ReadContractReturnType>;
  /**
   * Reads from the contract raw
   * @param functionName - Name of the function to call
   * @param args - Arguments to pass to the function
   * @returns - Raw result of the function call
   */
  readRaw: (functionName: string, args?: ContractArgs) => Promise<ReadRawResult>;
  /**
   * Writes to the contract raw
   * @param walletClient - Wallet client to use for the write operation (must be funded)
   * @param functionName - Name of the function to call
   * @param args - Arguments to pass to the function
   * @returns - Raw result of the write operation
   */
  writeRaw: (
    walletClient: WalletClient,
    functionName: string,
    args?: ContractArgs,
  ) => Promise<WriteRawResult>;
}
