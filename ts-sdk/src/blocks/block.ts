import { JsonRpcTransaction } from "../transactions";

export interface Block {
  difficulty: string;
  extraData: string;
  gasLimit: string;
  gasUsed: string;
  hash: string;
  logsBloom: string;
  miner: string;
  mixHash: string;
  nonce: string;
  number: number;
  parentHash: string;
  receiptsRoot: string;
  sha3Uncles: string;
  size: string;
  stateRoot: string;
  timestamp: number;
  totalDifficulty: string;
  transactions: string[];
  transactionsRoot: string;
  uncles: string[];
}

export type JsonRpcBlock = Omit<
  Block,
  "number" | "timestamp" | "transactions"
> & {
  number: string;
  timestamp: string;
  transactions: JsonRpcTransaction[];
};
