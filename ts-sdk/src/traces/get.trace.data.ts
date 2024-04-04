import { JsonRpcProvider } from "ethers";
import { Logger, WithRetry, assertExists } from "../utils";
import { Trace } from "./trace";
import { Cache } from "../cache";

export type GetTraceData = (
  chainId: number,
  blockNumberOrTxHash: number | string,
  provider: JsonRpcProvider
) => Promise<Trace[]>;

export function provideGetTraceData(
  cache: Cache,
  withRetry: WithRetry,
  logger: Logger
): GetTraceData {
  assertExists(cache, "cache");
  assertExists(withRetry, "withRetry");
  assertExists(logger, "logger");

  return async function getTraceData(
    chainId: number,
    blockNumberOrTxHash: number | string,
    provider: JsonRpcProvider
  ) {
    // check cache first
    const cachedTraceData = await cache.getTraceData(
      chainId,
      blockNumberOrTxHash
    );
    if (cachedTraceData) return cachedTraceData;

    // fetch trace data
    const isBlockNumber = typeof blockNumberOrTxHash === "number";
    try {
      const methodName = isBlockNumber ? "trace_block" : "trace_transaction";
      const params = isBlockNumber
        ? [`0x${blockNumberOrTxHash.toString(16)}`]
        : [blockNumberOrTxHash];
      const traceData: Trace[] = await withRetry(provider.send.bind(provider), [
        methodName,
        params,
      ]);

      await cache.setTraceData(chainId, blockNumberOrTxHash, traceData);
      return traceData;
    } catch (e) {
      logger.error(`error getting trace data: ${e.message}`);
    }

    return [];
  };
}
