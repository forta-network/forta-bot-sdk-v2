import { JsonRpcProvider } from "ethers";
import { WithRetry, assertExists } from "../utils";

// returns the latest block number as reported by the "eth_blockNumber" json-rpc method
export type GetLatestBlockNumber = (
  provider: JsonRpcProvider
) => Promise<number>;

export function provideGetLatestBlockNumber(
  withRetry: WithRetry
): GetLatestBlockNumber {
  assertExists(withRetry, "withRetry");

  return async function getLatestBlockNumber(provider: JsonRpcProvider) {
    const blockNumberHex: string = await withRetry(
      provider.send.bind(provider),
      ["eth_blockNumber", []]
    );
    return parseInt(blockNumberHex);
  };
}
