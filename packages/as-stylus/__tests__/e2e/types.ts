export interface TransferEventLog {
  address: string;
  topics: [string, string, string, ...string[]];
  data: string;
  blockHash: string;
  blockNumber: string;
  transactionHash: string;
  transactionIndex: string;
  logIndex: string;
  removed: boolean;
}
