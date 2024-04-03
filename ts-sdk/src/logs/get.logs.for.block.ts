import { JsonRpcProvider } from "ethers";
import { WithRetry, assertExists } from "../utils";
import { JsonRpcLog } from "./log";
import { Cache } from "../cache";

export type GetLogsForBlock = (
  chainId: number,
  blockNumber: number,
  provider: JsonRpcProvider
) => Promise<JsonRpcLog[]>;

export function provideGetLogsForBlock(
  cache: Cache,
  withRetry: WithRetry
): GetLogsForBlock {
  assertExists(cache, "cache");
  assertExists(withRetry, "withRetry");

  return async function getLogsForBlock(
    chainId: number,
    blockNumber: number,
    provider: JsonRpcProvider
  ) {
    // check cache first
    const cachedLogs = await cache.getLogsForBlock(chainId, blockNumber);
    if (cachedLogs) return cachedLogs;

    // fetch logs for the block
    const blockNumberHex = `0x${blockNumber.toString(16)}`;
    const logs: JsonRpcLog[] = await withRetry(provider.send.bind(provider), [
      "eth_getLogs",
      [{ fromBlock: blockNumberHex, toBlock: blockNumberHex }],
    ]);

    await cache.setLogsForBlock(chainId, blockNumber, logs);
    return logs;
  };
}
