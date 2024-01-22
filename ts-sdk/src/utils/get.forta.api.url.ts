import { FortaConfig, assertExists } from ".";

export type GetFortaApiUrl = () => string;

export function provideGetFortaApiUrl(
  fortaConfig: FortaConfig
): GetFortaApiUrl {
  assertExists(fortaConfig, "fortaConfig");

  return function getFortaApiUrl() {
    const {
      FORTA_PUBLIC_API_PROXY_HOST,
      FORTA_PUBLIC_API_PROXY_PORT,
      FORTA_API_URL,
    } = process.env;

    // if forta api url provided by scanner i.e. in production
    if (FORTA_PUBLIC_API_PROXY_HOST) {
      return `http://${FORTA_PUBLIC_API_PROXY_HOST}${
        FORTA_PUBLIC_API_PROXY_PORT ? `:${FORTA_PUBLIC_API_PROXY_PORT}` : ""
      }/graphql`;
    }

    // if provided via env var
    if (FORTA_API_URL) {
      return FORTA_API_URL;
    }

    // check if value provided in config
    const { fortaApiUrl } = fortaConfig;
    if (fortaApiUrl) return fortaApiUrl;

    // fallback to prod api
    return "https://api.forta.network/graphql";
  };
}
