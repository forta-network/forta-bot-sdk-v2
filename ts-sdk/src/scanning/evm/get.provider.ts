import { FetchRequest, JsonRpcProvider } from "ethers";
import { ScanEvmOptions } from "./scan.evm";
import { FortaConfig, GetChainId, assertExists } from "../../utils";
import { DecodeJwt, GetRpcJwt } from "../../jwt";
import { ONE_MIN_IN_MS } from "..";
import { MetricsHelper } from "../../metrics";

export type GetProvider = (options: ScanEvmOptions) => Promise<JsonRpcProvider>;

export function provideGetProvider(
  getRpcJwt: GetRpcJwt,
  decodeJwt: DecodeJwt,
  getChainId: GetChainId,
  fortaConfig: FortaConfig,
  metricsHelper: MetricsHelper,
  isProd: boolean
): GetProvider {
  assertExists(getRpcJwt, "getRpcJwt");
  assertExists(decodeJwt, "decodeJwt");
  assertExists(getChainId, "getChainId");
  assertExists(fortaConfig, "fortaConfig");
  assertExists(metricsHelper, "metricsHelper");

  // maintain a reference to the provider
  let provider: JsonRpcProvider;
  // if using rpcKeyId, keep track of when the issued jwt expires so we can refresh
  let rpcJwtExpirationMs: number;

  return async function getProvider(options: ScanEvmOptions) {
    if (provider && !isJwtExpired(rpcJwtExpirationMs)) {
      return provider;
    }

    let { rpcUrl, rpcKeyId, rpcJwtClaims, rpcHeaders, localRpcUrl } = options;
    // if there is a locally configured rpc url, use that when not running in production
    if (
      !isProd &&
      localRpcUrl &&
      fortaConfig.localRpcUrls &&
      fortaConfig.localRpcUrls[localRpcUrl]
    ) {
      rpcUrl = fortaConfig.localRpcUrls[localRpcUrl];
    }
    const rpcConnection = new FetchRequest(rpcUrl);

    // do jwt token exchange if rpcKeyId provided (only in production)
    if (isProd && rpcKeyId) {
      const rpcJwt = await getRpcJwt(rpcUrl, rpcKeyId, rpcJwtClaims);
      rpcConnection.setHeader("Authorization", `Bearer ${rpcJwt}`);
      rpcJwtExpirationMs = decodeJwt(rpcJwt).payload.exp * 1000;
    }

    // set any custom headers
    if (rpcHeaders) {
      for (const key of Object.keys(rpcHeaders)) {
        rpcConnection.setHeader(key, rpcHeaders[key]);
      }
    }

    provider = new JsonRpcProvider(rpcConnection, undefined, {
      staticNetwork: true,
    });

    const chainId = await getChainId(provider);
    // proxy the provider.send function to measure json-rpc call metrics
    provider.send = new Proxy(provider.send, {
      apply: async (target, thisArg, args: any) => {
        const methodName = args[0];
        let result: any;
        const requestId = metricsHelper.startJsonRpcTimer(chainId, methodName);
        try {
          result = await target.apply(thisArg, args);
          metricsHelper.reportJsonRpcSuccess(requestId, chainId, methodName);
        } catch (e) {
          if (e.message?.includes("429")) {
            metricsHelper.reportJsonRpcThrottled(
              requestId,
              chainId,
              methodName
            );
          } else {
            metricsHelper.reportJsonRpcError(requestId, chainId, methodName);
          }
          throw e;
        }
        return result;
      },
    });
    return provider;
  };
}

function isJwtExpired(rpcJwtExpirationMs?: number) {
  if (rpcJwtExpirationMs == undefined) return false;

  return rpcJwtExpirationMs + ONE_MIN_IN_MS >= Date.now();
}
