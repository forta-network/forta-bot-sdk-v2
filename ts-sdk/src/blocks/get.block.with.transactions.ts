import { JsonRpcProvider, toQuantity } from "ethers";
import { Cache } from "flat-cache";
import { assertExists } from "../utils";
import { JsonRpcBlock } from "./block";

// returns a block as provided by the "eth_getBlockByNumber" or "eth_getBlockByHash" json-rpc method
export type GetBlockWithTransactions = (
  blockHashOrNumber: string | number,
  provider: JsonRpcProvider,
  networkId: number
) => Promise<JsonRpcBlock>;

export function provideGetBlockWithTransactions(
  cache: Cache
): GetBlockWithTransactions {
  assertExists(cache, "cache");

  return async function getBlockWithTransactions(
    blockHashOrNumber: string | number,
    provider: JsonRpcProvider,
    networkId: number
  ) {
    // check the cache first
    const cachedBlock = cache.getKey(getCacheKey(blockHashOrNumber, networkId));
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
    const block = await provider.send(methodName, [
      toQuantity(blockHashOrNumber),
      true,
    ]);

    if (block) {
      cache.setKey(getCacheKey(block.hash, networkId), block);
      cache.setKey(getCacheKey(parseInt(block.number), networkId), block);
    }
    return block;
  };
}

export const getCacheKey = (
  blockHashOrNumber: number | string,
  networkId: number
) => `${networkId}-${blockHashOrNumber.toString().toLowerCase()}`;
