import { Cache as FlatCache } from "flat-cache";
import { JsonRpcBlock, JsonRpcLog, Trace } from "..";
import { Cache } from "./cache";
import { JsonRpcTransactionReceipt } from "../transactions";

export class DiskCache implements Cache {
  constructor(private readonly flatCache: FlatCache) {}

  async getLatestBlockNumber(chainId: number): Promise<string | undefined> {
    return undefined; // no-op
  }

  async getBlockWithTransactions(
    chainId: number,
    blockHashOrNumber: string | number
  ): Promise<JsonRpcBlock | undefined> {
    return this.flatCache.getKey(
      this.getBlockWithTransactionsKey(chainId, blockHashOrNumber)
    );
  }

  async setBlockWithTransactions(chainId: number, block: JsonRpcBlock) {
    // index by block hash
    this.flatCache.setKey(
      this.getBlockWithTransactionsKey(chainId, block.hash),
      block
    );
    // also index by block number
    this.flatCache.setKey(
      this.getBlockWithTransactionsKey(chainId, parseInt(block.number)),
      block
    );
  }

  private getBlockWithTransactionsKey(
    chainId: number,
    blockHashOrNumber: number | string
  ) {
    return `${chainId}-${blockHashOrNumber.toString().toLowerCase()}`;
  }

  async getLogsForBlock(
    chainId: number,
    blockNumber: number
  ): Promise<JsonRpcLog[] | undefined> {
    return this.flatCache.getKey(this.getLogsForBlockKey(chainId, blockNumber));
  }

  async setLogsForBlock(
    chainId: number,
    blockNumber: number,
    logs: JsonRpcLog[]
  ) {
    this.flatCache.setKey(this.getLogsForBlockKey(chainId, blockNumber), logs);
  }

  private getLogsForBlockKey(chainId: number, blockNumber: number) {
    return `${chainId}-${blockNumber}-logs`;
  }

  async getTraceData(
    chainId: number,
    blockNumberOrTxHash: string | number
  ): Promise<Trace[] | undefined> {
    return this.flatCache.getKey(
      this.getTraceDataKey(chainId, blockNumberOrTxHash)
    );
  }

  async setTraceData(
    chainId: number,
    blockNumberOrTxHash: string | number,
    traces: Trace[]
  ): Promise<void> {
    this.flatCache.setKey(
      this.getTraceDataKey(chainId, blockNumberOrTxHash),
      traces
    );
  }

  private getTraceDataKey(
    chainId: number,
    blockNumberOrTxHash: number | string
  ) {
    return `${chainId}-${blockNumberOrTxHash.toString().toLowerCase()}-trace`;
  }

  async getTransactionReceipt(
    chainId: number,
    txHash: string
  ): Promise<JsonRpcTransactionReceipt | undefined> {
    return this.flatCache.getKey(
      this.getTransactionReceiptKey(chainId, txHash)
    );
  }

  async setTransactionReceipt(
    chainId: number,
    txHash: string,
    receipt: JsonRpcTransactionReceipt
  ) {
    this.flatCache.setKey(
      this.getTransactionReceiptKey(chainId, txHash),
      receipt
    );
  }

  private getTransactionReceiptKey(chainId: number, txHash: string) {
    return `${chainId}-${txHash.toLowerCase()}`;
  }

  async getAlert(alertHash: string): Promise<object | undefined> {
    return this.flatCache.getKey(this.getAlertKey(alertHash));
  }

  async setAlert(alertHash: string, alert: object) {
    this.flatCache.setKey(this.getAlertKey(alertHash), alert);
  }

  private getAlertKey(alertHash: string) {
    return `${alertHash.toLowerCase()}-alert`;
  }

  async dump() {
    this.flatCache.save(true); // true = done remove keys not used in this run
  }
}
