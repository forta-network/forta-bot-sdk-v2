import { ethers } from "ethers";

export interface Log {
  address: string;
  topics: string[];
  data: string;
  logIndex: number;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  transactionHash: string;
  removed: boolean;
}

export type JsonRpcLog = Omit<
  Log,
  "logIndex" | "blockNumber" | "transactionIndex"
> & {
  logIndex: string;
  blockNumber: string;
  transactionIndex: string;
};

// used for decoded logs, simply including the originating address of the log and logIndex
export type LogDescription = ethers.LogDescription & {
  address: string;
  logIndex: number;
};
