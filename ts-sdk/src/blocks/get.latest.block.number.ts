import { JsonRpcProvider } from "ethers";
import { Logger, WithRetry, assertExists } from "../utils";
import { Cache } from "../cache";

// returns the latest block number as reported by the "eth_blockNumber" json-rpc method
export type GetLatestBlockNumber = (
  chainId: number,
  provider: JsonRpcProvider
) => Promise<number>;

export function provideGetLatestBlockNumber(
  cache: Cache,
  withRetry: WithRetry,
  logger: Logger
): GetLatestBlockNumber {
  assertExists(cache, "cache");
  assertExists(withRetry, "withRetry");

  return async function getLatestBlockNumber(
    chainId: number,
    provider: JsonRpcProvider
  ) {
    // check cache first
    logger.debug(`checking cache for eth_blockNumber for chain ${chainId}...`);
    let cachedBlockNumberHex = await cache.getLatestBlockNumber(chainId);
    if (cachedBlockNumberHex) {
      logger.debug(
        `chain ${chainId} latest cached eth_blockNumber: ${parseInt(
          cachedBlockNumberHex
        )}`
      );
      return parseInt(cachedBlockNumberHex);
    }

    logger.debug(
      `falling back to bot's provider for eth_blockNumber for chain ${chainId}...`
    );
    // try fetching from given provider
    const blockNumberHex: string = await withRetry(
      provider.send.bind(provider),
      ["eth_blockNumber", []]
    );
    return parseInt(blockNumberHex);
  };
}
