import { JsonRpcLog } from "../logs";
import { JsonRpcBlock } from "../blocks";
import { Trace } from "../traces";
import { JsonRpcTransactionReceipt } from "../transactions";

export interface Cache {
  getLatestBlockNumber(chainId: number): Promise<string | undefined>;

  getBlockWithTransactions(
    chainId: number,
    blockHashOrNumber: string | number
  ): Promise<JsonRpcBlock | undefined>;
  setBlockWithTransactions(chainId: number, block: JsonRpcBlock): Promise<void>;

  getLogsForBlock(
    chainId: number,
    blockNumber: number
  ): Promise<JsonRpcLog[] | undefined>;
  setLogsForBlock(
    chainId: number,
    blockNumber: number,
    logs: JsonRpcLog[]
  ): Promise<void>;

  getTraceData(
    chainId: number,
    blockNumberOrTxHash: string | number
  ): Promise<Trace[] | undefined>;
  setTraceData(
    chainId: number,
    blockNumberOrTxHash: string | number,
    traces: Trace[]
  ): Promise<void>;

  getTransactionReceipt(
    chainId: number,
    txHash: string
  ): Promise<JsonRpcTransactionReceipt | undefined>;
  setTransactionReceipt(
    chainId: number,
    txHash: string,
    receipt: JsonRpcTransactionReceipt
  ): Promise<void>;

  getAlert(alertHash: string): Promise<object | undefined>;
  setAlert(alertHash: string, alert: object): Promise<void>;

  dump(): Promise<void>;
}
