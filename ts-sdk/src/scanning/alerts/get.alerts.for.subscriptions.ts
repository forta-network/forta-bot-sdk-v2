import {
  Alert,
  AlertSubscription,
  AlertQueryOptions,
  AlertQueryResponse,
  GetAlerts,
} from "../../alerts";
import { assertExists } from "../../utils";

// used by scanAlerts to fetch alerts based on this bot's subscriptions
export type GetAlertsForSubscriptions = (
  subscriptions: AlertSubscription[]
) => Promise<Alert[]>;

export const TEN_MINUTES_IN_MS = 600000;

export function provideGetAlertsForSubscriptions(
  getAlerts: GetAlerts
): GetAlertsForSubscriptions {
  assertExists(getAlerts, "getAlerts");
  // maintain an in-memory map to keep track of alerts that have been seen (used for de-duping)
  const seenAlerts = new Map<string, boolean>(); // TODO use LRU cache instead of Map

  return async function getAlertsForSubscriptions(
    subscriptions: AlertSubscription[]
  ) {
    // run a query for each subscription (this keeps response payloads small to avoid API Gateway 10MB limit)
    const queries: Promise<Alert[]>[] = [];
    for (const subscription of subscriptions) {
      queries.push(runQuery(subscription, getAlerts));
    }
    const alertArrays = await Promise.all(queries);

    // flatten and de-dupe the responses
    const alerts: Alert[] = [];
    for (const alertArray of alertArrays) {
      for (const alert of alertArray) {
        if (seenAlerts.has(alert.hash!)) continue; // skip alerts we have already processed
        alerts.push(alert);
        seenAlerts.set(alert.hash!, true);
      }
    }
    return alerts;
  };
}

async function runQuery(
  subscription: AlertSubscription,
  getAlerts: GetAlerts
): Promise<Alert[]> {
  const alerts: Alert[] = [];
  let query: AlertQueryOptions;
  let response: AlertQueryResponse | undefined;
  let pageSize = 1000;
  let shouldRetryFromError = false;

  do {
    try {
      const { chainId, botId, alertId, alertIds } = subscription;
      query = {
        botIds: [botId],
        createdSince: TEN_MINUTES_IN_MS,
        first: pageSize,
        startingCursor: response?.pageInfo.endCursor,
      };
      if (chainId) {
        query.chainId = chainId;
      }
      if (alertId) {
        query.alertIds = [alertId];
      }
      if (alertIds?.length) {
        if (query.alertIds?.length) {
          query.alertIds.push(...alertIds);
        } else {
          query.alertIds = alertIds;
        }
      }
      response = await getAlerts(query);
      shouldRetryFromError = false;
      alerts.push(...response.alerts);
    } catch (e) {
      // if alerts API returned 500, its likely due to response size being over 10MB AWS gateway limit
      if (e.response?.status === 500) {
        // reduce the page size in order to reduce the response size and try again
        pageSize = Math.floor(pageSize / 2);
        shouldRetryFromError = pageSize > 1;
      } else {
        throw e;
      }
    }
  } while (shouldRetryFromError || response?.pageInfo?.hasNextPage);

  return alerts;
}
