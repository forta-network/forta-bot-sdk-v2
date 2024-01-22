import { RunCliCommand } from "../../cli";
import { HandleAlert } from "../../handlers";
import { GetBotId, Sleep, assertExists } from "../../utils";
import { GetAlertsForSubscriptions } from "./get.alerts.for.subscriptions";
import { ONE_MIN_IN_MS } from "..";
import {
  SendAlerts,
  AlertSubscription,
  RunHandlersOnAlert,
} from "../../alerts";
import { ShouldSubmitFindings } from "../should.submit.findings";
import { Finding } from "../../findings";

export type ScanAlerts = (options: ScanAlertsOptions) => Promise<void>;

export interface ScanAlertsOptions {
  subscriptions: AlertSubscription[];
  handleAlert: HandleAlert;
}

export function provideScanAlerts(
  isRunningCliCommand: boolean,
  runCliCommand: RunCliCommand,
  getAlertsForSubscriptions: GetAlertsForSubscriptions,
  runHandlersOnAlert: RunHandlersOnAlert,
  sendAlerts: SendAlerts,
  shouldSubmitFindings: ShouldSubmitFindings,
  sleep: Sleep,
  getBotId: GetBotId,
  fortaShardId: number | undefined,
  fortaShardCount: number | undefined,
  shouldContinuePolling: Function = () => true
): ScanAlerts {
  assertExists(runCliCommand, "runCliCommand");
  assertExists(getAlertsForSubscriptions, "getAlertsForSubscriptions");
  assertExists(runHandlersOnAlert, "runHandlersOnAlert");
  assertExists(sendAlerts, "sendAlerts");
  assertExists(shouldSubmitFindings, "shouldSubmitFindings");
  assertExists(sleep, "sleep");

  return async function scanAlerts(options: ScanAlertsOptions) {
    const { handleAlert, subscriptions } = options;
    if (!handleAlert) {
      throw new Error("no alert handler provided");
    }
    if (!subscriptions || !subscriptions.length) {
      throw new Error("no alert subscriptions provided");
    }

    // if running a CLI command, then dont start scanning
    if (isRunningCliCommand) {
      await runCliCommand({ scanAlertsOptions: options });
      return;
    }

    const botId = getBotId();
    let lastSubmissionTimestamp = Date.now(); // initialize to now
    let findings: Finding[] = [];

    while (shouldContinuePolling()) {
      console.log("querying alerts...");
      const alerts = await getAlertsForSubscriptions(subscriptions);
      console.log(`found ${alerts.length} alerts`);
      for (const alert of alerts) {
        // check if this alert should be processed
        if (
          isAlertOnThisShard(alert.createdAt!, fortaShardId, fortaShardCount)
        ) {
          // process alert
          findings = findings.concat(await runHandlersOnAlert(alert, options));
        }
      }

      // check if should submit any findings
      if (shouldSubmitFindings(findings, lastSubmissionTimestamp)) {
        await sendAlerts(findings.map((finding) => ({ botId, finding })));
        findings = []; // clear array
        lastSubmissionTimestamp = Date.now(); // remember timestamp
      }

      // wait a minute before querying again
      await sleep(ONE_MIN_IN_MS);
    }
  };
}

const isAlertOnThisShard = (
  alertTimestamp: string,
  shardId?: number,
  shardCount?: number
): boolean => {
  // if bot is not sharded
  if (shardId === undefined || shardCount === undefined) {
    return true; // process everything
  }

  // process alert if alertTimestamp modulo shardCount equals shardId
  return Math.floor(Date.parse(alertTimestamp) / 1000) % shardCount === shardId;
};
