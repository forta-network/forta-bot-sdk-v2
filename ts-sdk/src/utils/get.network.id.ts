import { JsonRpcProvider } from "ethers";
import { WithRetry } from "./with.retry";
import { assertExists } from "./assert";

// returns the network/chain id as reported by the "net_version" json-rpc method
export type GetNetworkId = (provider: JsonRpcProvider) => Promise<number>;

export function provideGetNetworkId(withRetry: WithRetry): GetNetworkId {
  assertExists(withRetry, "withRetry");

  return async function getNetworkId(provider: JsonRpcProvider) {
    const networkId: string = await withRetry(provider.send.bind(provider), [
      "net_version",
      [],
    ]);
    return parseInt(networkId);
  };
}
