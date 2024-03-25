import { asClass, asFunction, asValue } from "awilix";
import flatCache from "flat-cache";
import { JsonRpcCache } from "./json.rpc.cache";
import { DiskCache } from "./disk.cache";
import { provideGetJsonRpcCacheProvider } from "./get.json.rpc.cache.provider";

export default {
  cache: asFunction(
    (isProd: boolean, jsonRpcCache: JsonRpcCache, diskCache: DiskCache) => {
      if (isProd) {
        return jsonRpcCache;
      } else {
        return diskCache;
      }
    }
  ).singleton(),
  jsonRpcCache: asClass(JsonRpcCache).singleton(),
  diskCache: asClass(DiskCache).singleton(),
  flatCache: asFunction((fortaGlobalRoot: string) =>
    flatCache.load("forta-bot-cache", fortaGlobalRoot)
  ).singleton(),
  getJsonRpcCacheProvider: asFunction(
    provideGetJsonRpcCacheProvider
  ).singleton(),
  jsonRpcCacheUrl: asFunction(() => {
    const host = process.env.JSON_RPC_CACHE_HOST || process.env.JSON_RPC_HOST;
    const port = process.env.JSON_RPC_CACHE_PORT;
    return `http://${host}:${port}`;
  }),
  jsonRpcCacheRetryOptions: asValue({
    timeoutSeconds: process.env.JSON_RPC_CACHE_TIMEOUT
      ? parseInt(process.env.JSON_RPC_CACHE_TIMEOUT)
      : 20,
    backoffSeconds: process.env.JSON_RPC_CACHE_INTERVAL
      ? parseInt(process.env.JSON_RPC_CACHE_INTERVAL)
      : 1,
  }),
  supportedCacheChainIds: asFunction(() => {
    if ("JSON_RPC_CACHE_SUPPORTED_CHAINS" in process.env) {
      const chainIds = process.env.JSON_RPC_CACHE_SUPPORTED_CHAINS!.split(",");
      return chainIds.map((chainId: string) => parseInt(chainId)); // convert to integers
    }
    return [];
  }).singleton(),
};
