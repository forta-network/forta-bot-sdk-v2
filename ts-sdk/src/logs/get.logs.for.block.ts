import { JsonRpcProvider } from "ethers";
import { Cache } from "flat-cache";
import { assertExists } from "../utils";
import { JsonRpcLog } from "./log";

export type GetLogsForBlock = (
  blockNumber: number,
  provider: JsonRpcProvider,
  chainId: number
) => Promise<JsonRpcLog[]>;

export function provideGetLogsForBlock(cache: Cache): GetLogsForBlock {
  assertExists(cache, "cache");

  return async function getLogsForBlock(
    blockNumber: number,
    provider: JsonRpcProvider,
    chainId: number
  ) {
    // check cache first
    const cacheKey = getCacheKey(blockNumber, chainId);
    const cachedLogs = cache.getKey(cacheKey);
    if (cachedLogs) return cachedLogs;

    // fetch logs for the block
    const blockNumberHex = `0x${blockNumber.toString(16)}`;
    const logs = await provider.send("eth_getLogs", [
      { fromBlock: blockNumberHex, toBlock: blockNumberHex },
    ]);
    cache.setKey(cacheKey, logs);
    return logs;
  };
}

export const getCacheKey = (blockNumber: number, chainId: number) =>
  `${chainId}-${blockNumber}-logs`;
