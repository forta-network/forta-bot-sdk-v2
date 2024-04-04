import { JsonRpcProvider } from "ethers";
import { JsonRpcTransactionReceipt } from "../transactions";
import { WithRetry, assertExists } from "../utils";
import { Cache } from "../cache";

// returns a transaction receipt as provided by the "eth_getTransactionReceipt" json-rpc method
export type GetTransactionReceipt = (
  txHash: string,
  provider: JsonRpcProvider,
  chainId: number
) => Promise<JsonRpcTransactionReceipt>;

export function provideGetTransactionReceipt(
  cache: Cache,
  withRetry: WithRetry
): GetTransactionReceipt {
  assertExists(cache, "cache");
  assertExists(withRetry, "withRetry");

  return async function getTransactionReceipt(
    txHash: string,
    provider: JsonRpcProvider,
    chainId: number
  ) {
    // check cache first
    const cachedReceipt = await cache.getTransactionReceipt(chainId, txHash);
    if (cachedReceipt) return cachedReceipt;

    // fetch the receipt
    const receipt = await withRetry(provider.send.bind(provider), [
      "eth_getTransactionReceipt",
      [txHash],
    ]);

    if (receipt) {
      await cache.setTransactionReceipt(chainId, txHash, receipt);
    }
    return receipt;
  };
}
