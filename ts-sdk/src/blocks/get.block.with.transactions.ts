import { JsonRpcProvider, toQuantity } from "ethers";
import { WithRetry, assertExists } from "../utils";
import { Cache } from "../cache";
import { JsonRpcBlock } from "./block";

// returns a block as provided by the "eth_getBlockByNumber" or "eth_getBlockByHash" json-rpc method
export type GetBlockWithTransactions = (
  chainId: number,
  blockHashOrNumber: string | number,
  provider: JsonRpcProvider
) => Promise<JsonRpcBlock>;

export function provideGetBlockWithTransactions(
  cache: Cache,
  withRetry: WithRetry
): GetBlockWithTransactions {
  assertExists(cache, "cache");
  assertExists(withRetry, "withRetry");

  return async function getBlockWithTransactions(
    chainId: number,
    blockHashOrNumber: string | number,
    provider: JsonRpcProvider
  ) {
    // check the cache first
    const cachedBlock = await cache.getBlockWithTransactions(
      chainId,
      blockHashOrNumber
    );
    if (cachedBlock) return cachedBlock;

    // determine whether to call getBlockByNumber or getBlockByHash based on input
    let methodName = "eth_getBlockByNumber";
    if (typeof blockHashOrNumber === "string") {
      if (!blockHashOrNumber.startsWith("0x")) {
        blockHashOrNumber = parseInt(blockHashOrNumber);
      } else {
        methodName = "eth_getBlockByHash";
      }
    }

    // fetch the block
    const block: JsonRpcBlock = await withRetry(provider.send.bind(provider), [
      methodName,
      [toQuantity(blockHashOrNumber), true],
    ]);

    if (block) {
      await cache.setBlockWithTransactions(chainId, block);
    }
    return block;
  };
}
