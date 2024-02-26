import { JsonRpcProvider } from "ethers";
import { Cache } from "flat-cache";
import { Logger, assertExists } from "../utils";
import { Trace } from "./trace";

export type GetTraceData = (
  blockNumberOrTxHash: number | string,
  provider: JsonRpcProvider,
  chainId: number
) => Promise<Trace[]>;

export function provideGetTraceData(
  cache: Cache,
  logger: Logger
): GetTraceData {
  assertExists(cache, "cache");
  assertExists(logger, "logger");

  return async function getTraceData(
    blockNumberOrTxHash: number | string,
    provider: JsonRpcProvider,
    chainId: number
  ) {
    // check cache first
    const cacheKey = getCacheKey(blockNumberOrTxHash, chainId);
    const cachedTraceData = cache.getKey(cacheKey);
    if (cachedTraceData) return cachedTraceData;

    // fetch trace data
    const isBlockNumber = typeof blockNumberOrTxHash === "number";
    try {
      const methodName = isBlockNumber ? "trace_block" : "trace_transaction";
      const params = isBlockNumber
        ? [`0x${blockNumberOrTxHash.toString(16)}`]
        : [blockNumberOrTxHash];
      const traceData = await provider.send(methodName, params);

      cache.setKey(cacheKey, traceData);
      return traceData;
    } catch (e) {
      logger.error(`error getting trace data: ${e.message}`);
    }

    return [];
  };
}

export const getCacheKey = (
  blockNumberOrTxHash: number | string,
  chainId: number
) => `${chainId}-${blockNumberOrTxHash.toString().toLowerCase()}-trace`;
