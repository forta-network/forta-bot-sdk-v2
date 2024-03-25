import { Cache } from "../cache";
import { assertExists } from "../utils";
import { Alert } from "./alert";
import { GetAlerts } from "./get.alerts";

// used by runHandlersOnAlert to fetch a specific alert and process it
export type GetAlert = (alertHash: string) => Promise<Alert>;

export const ONE_DAY_IN_MS = 86400000;
export const LOOKBACK_PERIOD_DAYS = 90;

export function provideGetAlert(getAlerts: GetAlerts, cache: Cache): GetAlert {
  assertExists(getAlerts, "getAlerts");
  assertExists(cache, "cache");

  return async function getAlert(alertHash: string) {
    // check cache first
    const cachedAlert = await cache.getAlert(alertHash);
    if (cachedAlert) return Alert.fromObject(cachedAlert);

    // fetch the alert
    const endDate = new Date(); // i.e. now
    const startDate = new Date(
      endDate.getTime() - LOOKBACK_PERIOD_DAYS * ONE_DAY_IN_MS
    );
    const alertsResponse = await getAlerts({
      alertHash,
      blockDateRange: {
        startDate,
        endDate,
      },
    });
    if (alertsResponse.alerts.length == 0) {
      throw new Error(`no alert found with hash ${alertHash}`);
    }
    const alert = alertsResponse.alerts[0];

    await cache.setAlert(alertHash, JSON.parse(alert.toString()));
    return alert;
  };
}
