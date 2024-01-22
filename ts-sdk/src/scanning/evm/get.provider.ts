import { FetchRequest, JsonRpcProvider } from "ethers";
import { ScanEvmOptions } from "./scan.evm";
import { FortaConfig, assertExists } from "../../utils";
import { DecodeJwt, GetRpcJwt } from "../../jwt";
import { ONE_MIN_IN_MS } from "..";

export type GetProvider = (options: ScanEvmOptions) => Promise<JsonRpcProvider>;

export function provideGetProvider(
  getRpcJwt: GetRpcJwt,
  decodeJwt: DecodeJwt,
  fortaConfig: FortaConfig,
  isProd: boolean
): GetProvider {
  assertExists(getRpcJwt, "getRpcJwt");
  assertExists(decodeJwt, "decodeJwt");
  assertExists(fortaConfig, "fortaConfig");

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
      rpcConnection.setHeader("Authorization", rpcJwt);
      rpcJwtExpirationMs =
        decodeJwt(rpcJwt.replace("Bearer ", "")).payload.exp * 1000;
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
    return provider;
  };
}

function isJwtExpired(rpcJwtExpirationMs?: number) {
  if (rpcJwtExpirationMs == undefined) return false;

  return rpcJwtExpirationMs + ONE_MIN_IN_MS >= Date.now();
}
