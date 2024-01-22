import { JsonRpcLog, Log } from "../logs";

export interface Receipt {
  status: boolean;
  root: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  logsBloom: string;
  logs: Log[];
  contractAddress: string | null;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  transactionHash: string;
}

export type JsonRpcTransactionReceipt = Omit<
  Receipt,
  "status" | "blockNumber" | "transactionIndex" | "logs"
> & {
  status: string;
  blockNumber: string;
  transactionIndex: string;
  from: string;
  logs: JsonRpcLog[];
};
