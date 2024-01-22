import { RunHandlersOnAlert } from "../alerts";
import { ScanAlertsOptions } from "../scanning";
import { assertExists } from "../utils";

// runs alert handlers against a specified alert(s)
export type RunAlert = (
  alertHash: string,
  options: ScanAlertsOptions
) => Promise<void>;

export function provideRunAlert(
  runHandlersOnAlert: RunHandlersOnAlert
): RunAlert {
  assertExists(runHandlersOnAlert, "runHandlersOnAlert");

  return async function runAlert(
    alertHash: string,
    options: ScanAlertsOptions
  ) {
    let hashes = [alertHash];
    // support for specifying multiple alerts with comma-delimited list
    if (alertHash.includes(",")) {
      hashes = alertHash.split(",");
    }

    for (const hash of hashes) {
      await runHandlersOnAlert(hash, options);
    }
  };
}
