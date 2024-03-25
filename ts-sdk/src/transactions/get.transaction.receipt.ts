import { JsonRpcProvider } from "ethers";
import { JsonRpcTransactionReceipt } from "../transactions";
import { assertExists } from "../utils";
import { Cache } from "../cache";

// returns a transaction receipt as provided by the "eth_getTransactionReceipt" json-rpc method
export type GetTransactionReceipt = (
  txHash: string,
  provider: JsonRpcProvider,
  chainId: number
) => Promise<JsonRpcTransactionReceipt>;

export function provideGetTransactionReceipt(
  cache: Cache
): GetTransactionReceipt {
  assertExists(cache, "cache");

  return async function getTransactionReceipt(
    txHash: string,
    provider: JsonRpcProvider,
    chainId: number
  ) {
    // check cache first
    const cachedReceipt = await cache.getTransactionReceipt(chainId, txHash);
    if (cachedReceipt) return cachedReceipt;

    // fetch the receipt
    const receipt = await provider.send("eth_getTransactionReceipt", [txHash]);

    await cache.setTransactionReceipt(chainId, txHash, receipt);
    return receipt;
  };
}
