import { JsonRpcProvider } from "ethers";
import { WithRetry } from "./with.retry";
import { assertExists } from "./assert";

// returns the chain id as reported by the "eth_chainId" json-rpc method
export type GetChainId = (provider: JsonRpcProvider) => Promise<number>;

export function provideGetChainId(withRetry: WithRetry): GetChainId {
  assertExists(withRetry, "withRetry");

  return async function getChainId(provider: JsonRpcProvider) {
    const chainId: string = await withRetry(provider.send.bind(provider), [
      "eth_chainId",
      [],
    ]);
    return parseInt(chainId);
  };
}
