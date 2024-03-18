import { asFunction, asValue } from "awilix";
import { FortaConfig } from "../utils";
import { provideGetRpcJwt } from "./get.rpc.jwt";
import { provideGetScannerJwt } from "./get.scanner.jwt";
import { provideVerifyJwt } from "./verify.jwt";
import { provideDecodeJwt } from "./decode.jwt";

export default {
  getScannerJwt: asFunction(provideGetScannerJwt),
  getRpcJwt: asFunction(provideGetRpcJwt),
  verifyJwt: asFunction(provideVerifyJwt),
  decodeJwt: asFunction(provideDecodeJwt),
  tokenExchangeUrl: asFunction((fortaConfig: FortaConfig) => {
    return (
      fortaConfig.tokenExchangeUrl ||
      process.env.FORTA_TOKEN_EXCHANGE_URL ||
      "https://alerts.forta.network/exchange-token"
    );
  }),
  registerKeyIdUrl: asFunction((fortaConfig: FortaConfig) => {
    return (
      fortaConfig.registerKeyIdUrl ||
      process.env.FORTA_REGISTER_KEY_ID_URL ||
      "https://alerts.forta.network/claim-key-id"
    );
  }),
  polygonRpcUrl: asFunction((fortaConfig: FortaConfig) => {
    return (
      fortaConfig.polygonJsonRpcUrl ||
      process.env.POLYGON_RPC_URL ||
      "https://polygon-rpc.com"
    );
  }),
  fortaJwtProviderHost: asValue(
    process.env.FORTA_JWT_PROVIDER_HOST || "forta-jwt-provider"
  ),
  fortaJwtProviderPort: asValue(process.env.FORTA_JWT_PROVIDER_PORT || 8515),
};
