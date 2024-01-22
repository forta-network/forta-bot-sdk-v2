import { asFunction } from "awilix";
import { provideGetProvider } from "./evm/get.provider";
import { provideScanEvm } from "./evm/scan.evm";
import { provideScanAlerts } from "./alerts/scan.alerts";
import { provideGetAlertsForSubscriptions } from "./alerts/get.alerts.for.subscriptions";
import { provideShouldSubmitFindings } from "./should.submit.findings";

export default {
  shouldSubmitFindings: asFunction(provideShouldSubmitFindings),

  // evm module
  getProvider: asFunction(provideGetProvider),
  scanEvm: asFunction(provideScanEvm),

  // alerts module
  scanAlerts: asFunction(provideScanAlerts),
  getAlertsForSubscriptions: asFunction(provideGetAlertsForSubscriptions),
};
