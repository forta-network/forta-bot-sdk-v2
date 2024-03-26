import { toQuantity } from "ethers";
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
  constructor(
    private readonly getJsonRpcCacheProvider: GetJsonRpcCacheProvider,
    private readonly jsonRpcCacheRetryOptions: RetryOptions,
    private readonly isCacheHealthy: IsCacheHealthy,
    private readonly metricsHelper: MetricsHelper,
    private readonly withRetry: WithRetry,
    private readonly logger: Logger
  ) {}

  async getLatestBlockNumber(chainId: number): Promise<string | undefined> {
    const blockNumber = await this.makeRequest(chainId, "eth_blockNumber", []);
    this.logger.info(
      `chain ${chainId} latest cached block number: ${parseInt(blockNumber)}`
    );
    return blockNumber;
  }

  async getBlockWithTransactions(
    chainId: number,
    blockNumber: number
  ): Promise<JsonRpcBlock | undefined> {
    return this.makeRequest(chainId, "eth_getBlockByNumber", [
      toQuantity(blockNumber),
      true,
    ]);
  }

  async getLogsForBlock(
    chainId: number,
    blockNumber: number
  ): Promise<JsonRpcLog[] | undefined> {
    const blockNumberHex = `0x${blockNumber.toString(16)}`;
    return this.makeRequest(chainId, "eth_getLogs", [
      { fromBlock: blockNumberHex, toBlock: blockNumberHex },
    ]);
  }

  async getTraceData(
    chainId: number,
    blockNumber: number
  ): Promise<Trace[] | undefined> {
    return this.makeRequest(chainId, "trace_block", [
      `0x${blockNumber.toString(16)}`,
    ]);
  }

  private async makeRequest(chainId: number, methodName: string, args: any[]) {
    const isCacheHealthy = await this.isCacheHealthy(chainId);
    this.logger.log(`isCacheHealthy(${chainId})=${isCacheHealthy}`);
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
      this.logger.log(
        `gave up fetching ${methodName} from rpc cache for chain ${chainId}: ${e}`
      );
      this.metricsHelper.reportJsonRpcCacheError(
        requestId,
        chainId,
        methodName
      );
    }
    return undefined;
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
