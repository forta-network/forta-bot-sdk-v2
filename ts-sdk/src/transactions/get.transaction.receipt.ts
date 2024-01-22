import { JsonRpcProvider } from "ethers";
import { Cache } from "flat-cache";
import { JsonRpcTransactionReceipt } from "../transactions";
import { assertExists } from "../utils";

// returns a transaction receipt as provided by the "eth_getTransactionReceipt" json-rpc method
export type GetTransactionReceipt = (
  txHash: string,
  provider: JsonRpcProvider,
  networkId: number
) => Promise<JsonRpcTransactionReceipt>;

export function provideGetTransactionReceipt(
  cache: Cache
): GetTransactionReceipt {
  assertExists(cache, "cache");

  return async function getTransactionReceipt(
    txHash: string,
    provider: JsonRpcProvider,
    networkId: number
  ) {
    // check cache first
    const cacheKey = getCacheKey(txHash, networkId);
    const cachedReceipt = cache.getKey(cacheKey);
    if (cachedReceipt) return cachedReceipt;

    // fetch the receipt
    const receipt = await provider.send("eth_getTransactionReceipt", [txHash]);

    if (receipt) {
      cache.setKey(cacheKey, receipt);
    }
    return receipt;
  };
}

export const getCacheKey = (txHash: string, networkId: number) =>
  `${networkId}-${txHash.toLowerCase()}`;
