import { toQuantity } from "ethers";
import { LRUCache } from "lru-cache";
import { JsonRpcBlock } from "../blocks";
import { Logger, WithRetry } from "../utils";
import { RetryOptions } from "../utils/with.retry";
import { JsonRpcLog } from "../logs";
import { JsonRpcTransactionReceipt } from "../transactions";
import { MetricsHelper } from "../metrics";
import { Trace } from "../traces";
import { Cache } from "./cache";
import { GetJsonRpcCacheProvider } from "./get.json.rpc.cache.provider";
import { IsCacheHealthy } from "./is.cache.healthy";

export class JsonRpcCache implements Cache {
  private readonly ignoredBlocks = new LRUCache({ max: 10_000 });
  private readonly ignoredChains: { [chainId: number]: number } = {};
  private readonly CHAIN_IGNORE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly getJsonRpcCacheProvider: GetJsonRpcCacheProvider,
    private readonly jsonRpcCacheRetryOptions: RetryOptions,
    private readonly isCacheHealthy: IsCacheHealthy,
    private readonly metricsHelper: MetricsHelper,
    private readonly withRetry: WithRetry,
    private readonly logger: Logger
  ) {}

  private ignoreBlock(chainId: number, blockNumber: number): void {
    this.ignoredBlocks.set(`${chainId}-${blockNumber}`, true);
  }

  private isBlockIgnored(chainId: number, blockNumber: number): boolean {
    return this.ignoredBlocks.has(`${chainId}-${blockNumber}`);
  }

  private ignoreChain(chainId: number): void {
    this.ignoredChains[chainId] = Date.now() + this.CHAIN_IGNORE_DURATION_MS;
  }

  private isChainIgnored(chainId: number): boolean {
    return (
      chainId in this.ignoredChains && Date.now() < this.ignoredChains[chainId]
    );
  }

  async getLatestBlockNumber(chainId: number): Promise<string | undefined> {
    if (this.isChainIgnored(chainId)) return undefined;

    try {
      const blockNumber = await this.makeRequest(
        chainId,
        "eth_blockNumber",
        []
      );
      this.logger.debug(
        `chain ${chainId} latest cached block number: ${parseInt(blockNumber)}`
      );
      return blockNumber;
    } catch (e) {}
    return undefined;
  }

  async getBlockWithTransactions(
    chainId: number,
    blockNumber: number
  ): Promise<JsonRpcBlock | undefined> {
    if (this.isChainIgnored(chainId)) return undefined;

    try {
      return this.makeRequest(chainId, "eth_getBlockByNumber", [
        toQuantity(blockNumber),
        true,
      ]);
    } catch (e) {
      // if the block was not in cache, ignore the block so we dont try to fetch its logs or traces from cache
      this.ignoreBlock(chainId, blockNumber);
      // if last 3 blocks were not in cache, ignore the chain for a while
      if (
        this.isBlockIgnored(chainId, blockNumber - 1) &&
        this.isBlockIgnored(chainId, blockNumber - 2)
      ) {
        this.ignoreChain(chainId);
      }
    }
    return undefined;
  }

  async getLogsForBlock(
    chainId: number,
    blockNumber: number
  ): Promise<JsonRpcLog[] | undefined> {
    if (this.isChainIgnored(chainId)) return undefined;
    if (this.isBlockIgnored(chainId, blockNumber)) return undefined;

    try {
      const blockNumberHex = `0x${blockNumber.toString(16)}`;
      return this.makeRequest(chainId, "eth_getLogs", [
        { fromBlock: blockNumberHex, toBlock: blockNumberHex },
      ]);
    } catch (e) {}
    return undefined;
  }

  async getTraceData(
    chainId: number,
    blockNumber: number
  ): Promise<Trace[] | undefined> {
    if (this.isChainIgnored(chainId)) return undefined;
    if (this.isBlockIgnored(chainId, blockNumber)) return undefined;

    try {
      return this.makeRequest(chainId, "trace_block", [
        `0x${blockNumber.toString(16)}`,
      ]);
    } catch (e) {}
    return undefined;
  }

  private async makeRequest(chainId: number, methodName: string, args: any[]) {
    const isCacheHealthy = await this.isCacheHealthy(chainId);
    this.logger.debug(`isCacheHealthy(${chainId})=${isCacheHealthy}`);
    if (!isCacheHealthy) return undefined;

    const provider = await this.getJsonRpcCacheProvider(chainId);
    const requestId = this.metricsHelper.startJsonRpcCacheTimer(
      chainId,
      methodName
    );
    try {
      const value = await this.withRetry(
        provider.send.bind(provider),
        [methodName, args],
        this.jsonRpcCacheRetryOptions
      );
      this.metricsHelper.reportJsonRpcCacheSuccess(
        requestId,
        chainId,
        methodName
      );
      return value;
    } catch (e) {
      this.logger.debug(
        `gave up fetching ${methodName} from rpc cache for chain ${chainId}: ${e}`
      );
      this.metricsHelper.reportJsonRpcCacheError(
        requestId,
        chainId,
        methodName
      );
      throw e; // i.e. cache miss
    }
  }

  async setBlockWithTransactions(chainId: number, block: JsonRpcBlock) {
    // no-op
  }

  async setLogsForBlock(
    chainId: number,
    blockNumber: number,
    logs: JsonRpcLog[]
  ) {
    //no-op
  }

  async setTraceData(
    chainId: number,
    blockNumberOrTxHash: string | number,
    traces: Trace[]
  ) {
    // no-op
  }

  async getTransactionReceipt(
    chainId: number,
    txHash: string
  ): Promise<JsonRpcTransactionReceipt | undefined> {
    return undefined; // no-op
  }

  async setTransactionReceipt(
    chainId: number,
    txHash: string,
    receipt: JsonRpcTransactionReceipt
  ) {
    // no-op
  }

  async getAlert(alertHash: string): Promise<object | undefined> {
    return undefined; //no-op
  }

  async setAlert(alertHash: string, alert: object): Promise<void> {
    // no-op
  }

  async dump() {
    // no-op
  }
}
