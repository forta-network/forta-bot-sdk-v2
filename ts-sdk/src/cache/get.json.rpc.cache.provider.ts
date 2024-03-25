import { FetchRequest, JsonRpcProvider, Network } from "ethers";
import { assertIsNonEmptyString } from "../utils";

export type GetJsonRpcCacheProvider = (
  chainId: number
) => JsonRpcProvider | undefined;

export function provideGetJsonRpcCacheProvider(
  jsonRpcCacheUrl: string,
  supportedCacheChainIds: number[]
): GetJsonRpcCacheProvider {
  assertIsNonEmptyString(jsonRpcCacheUrl, "jsonRpcCacheUrl");

  // store the created providers in-memory for reuse
  const jsonRpcCacheProviders: { [chainId: number]: JsonRpcProvider } = {};

  return function getJsonRpcCacheProvider(chainId: number) {
    // if chainId is not supported by cache, return undefined
    if (!supportedCacheChainIds.includes(chainId)) return undefined;

    // check if we've already created a provider for this chain
    if (chainId in jsonRpcCacheProviders) {
      return jsonRpcCacheProviders[chainId];
    }

    // create a new provider for the chain
    const rpcConnection = new FetchRequest(jsonRpcCacheUrl);
    // set the header to tell the scan node which chain we are talking about
    rpcConnection.setHeader("X-Forta-Chain-ID", chainId);
    const provider = new JsonRpcProvider(rpcConnection, Network.from(chainId), {
      staticNetwork: true,
    });
    jsonRpcCacheProviders[chainId] = provider;
    return provider;
  };
}
