import { JsonRpcProvider } from "ethers";
import { assertExists } from "../utils";
import { JsonRpcLog } from "./log";
import { Cache } from "../cache";

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
    const cachedLogs = await cache.getLogsForBlock(chainId, blockNumber);
    if (cachedLogs) return cachedLogs;

    // fetch logs for the block
    const blockNumberHex = `0x${blockNumber.toString(16)}`;
    const logs = await provider.send("eth_getLogs", [
      { fromBlock: blockNumberHex, toBlock: blockNumberHex },
    ]);
    await cache.setLogsForBlock(chainId, blockNumber, logs);
    return logs;
  };
}
