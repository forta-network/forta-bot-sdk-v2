import { FortaConfig, assertExists } from ".";

export type GetFortaApiHeaders = () => { [headers: string]: string };

export function provideGetFortaApiHeaders(
  fortaConfig: FortaConfig
): GetFortaApiHeaders {
  assertExists(fortaConfig, "fortaConfig");

  return function getFortaApiHeaders() {
    const headers: any = { "content-type": "application/json" };

    // try the api key specified in env vars first
    if (process.env.FORTA_API_KEY) {
      headers["Authorization"] = `Bearer ${process.env.FORTA_API_KEY}`;
    } else {
      // use the api key from forta config if available (only for local development)
      let { fortaApiKey } = fortaConfig;
      if (fortaApiKey) {
        headers["Authorization"] = `Bearer ${fortaApiKey}`;
      }
    }

    return {
      headers,
    };
  };
}
