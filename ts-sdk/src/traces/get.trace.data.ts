import { JsonRpcProvider } from "ethers";
import { Logger, assertExists } from "../utils";
import { Trace } from "./trace";
import { Cache } from "../cache";

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
      const traceData = await provider.send(methodName, params);

      await cache.setTraceData(chainId, blockNumberOrTxHash, traceData);
      return traceData;
    } catch (e) {
      logger.error(`error getting trace data: ${e.message}`);
    }

    return [];
  };
}
