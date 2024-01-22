import { Finding } from "../findings";
import { assertExists, assertFindings } from "../utils";
import { ScanAlertsOptions } from "../scanning";
import { Alert } from "./alert";
import { GetAlert } from "./get.alert";
import { CreateAlertEvent } from "./create.alert.event";

export type RunHandlersOnAlert = (
  alertOrHash: string | Alert,
  options: ScanAlertsOptions
) => Promise<Finding[]>;

export function provideRunHandlersOnAlert(
  getAlert: GetAlert,
  createAlertEvent: CreateAlertEvent,
  shouldStopOnErrors: boolean
): RunHandlersOnAlert {
  assertExists(getAlert, "getAlert");
  assertExists(createAlertEvent, "createAlertEvent");

  return async function runHandlersOnAlert(
    alertOrHash: string | Alert,
    options: ScanAlertsOptions
  ) {
    const { handleAlert } = options;
    if (!handleAlert) {
      throw new Error("no alert handler provided");
    }

    let alert: Alert;
    // if passed in a string hash
    if (typeof alertOrHash === "string") {
      console.log(`fetching alert ${alertOrHash}...`);
      alert = await getAlert(alertOrHash);
    } else {
      // if passed in an alert
      alert = alertOrHash;
    }

    let findings: Finding[] = [];
    try {
      const alertEvent = createAlertEvent(alert);
      findings = await handleAlert(alertEvent);

      assertFindings(findings);
      console.log(
        `${findings.length} findings for alert ${alert.hash} ${findings}`
      );
    } catch (e) {
      if (shouldStopOnErrors) {
        throw e;
      }
      console.log(`${new Date().toISOString()}    handleAlert ${alert.hash}`);
      console.log(e);
    }
    return findings;
  };
}
