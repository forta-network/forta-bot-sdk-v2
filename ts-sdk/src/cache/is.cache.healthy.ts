import { AxiosInstance } from "axios";
import { assertExists, assertIsNonEmptyString } from "../utils";

// checks whether cache data for a given chain is "healthy" (i.e. chain is supported and data is fresh)
export type IsCacheHealthy = (chainId: number) => Promise<boolean>;

type HealthStatus = {
  isHealthy: boolean;
  timestamp: number;
};

export const ONE_MIN_IN_MS = 60000;

export function provideIsCacheHealthy(
  jsonRpcCacheUrl: string,
  axios: AxiosInstance
): IsCacheHealthy {
  assertIsNonEmptyString(jsonRpcCacheUrl, "jsonRpcCacheUrl");
  assertExists(axios, "axios");

  // cache health status responses in-memory
  const healthStatus: { [chainId: number]: HealthStatus } = {};

  return async function isCacheHealthy(chainId: number) {
    // if we have a previous status for this chain that is not expired, return it
    const status = healthStatus[chainId];
    if (status && Date.now() - status.timestamp < ONE_MIN_IN_MS) {
      return status.isHealthy;
    }

    // query cache for health status
    let isHealthy = false;
    try {
      await axios.get(`${jsonRpcCacheUrl}/health/${chainId}`);
      isHealthy = true;
    } catch (e) {
      isHealthy = false;
    }
    healthStatus[chainId] = { isHealthy, timestamp: Date.now() };
    return isHealthy;
  };
}
