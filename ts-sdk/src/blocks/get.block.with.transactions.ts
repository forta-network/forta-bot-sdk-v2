import { JsonRpcProvider, toQuantity } from "ethers";
import { assertExists } from "../utils";
import { Cache } from "../cache";
import { JsonRpcBlock } from "./block";

// returns a block as provided by the "eth_getBlockByNumber" or "eth_getBlockByHash" json-rpc method
export type GetBlockWithTransactions = (
  chainId: number,
  blockHashOrNumber: string | number,
  provider: JsonRpcProvider
) => Promise<JsonRpcBlock>;

export function provideGetBlockWithTransactions(
  cache: Cache
): GetBlockWithTransactions {
  assertExists(cache, "cache");

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
    const block: JsonRpcBlock = await provider.send(methodName, [
      toQuantity(blockHashOrNumber),
      true,
    ]);

    await cache.setBlockWithTransactions(chainId, block);
    return block;
  };
}
