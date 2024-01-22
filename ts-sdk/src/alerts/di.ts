import { asFunction } from "awilix";
import { provideGetAlerts } from "./get.alerts";
import { provideSendAlerts } from "./send.alerts";
import { provideCreateAlertEvent } from "./create.alert.event";
import { provideGetAlert } from "./get.alert";
import { provideRunHandlersOnAlert } from "./run.handlers.on.alert";

export default {
  sendAlerts: asFunction(provideSendAlerts),
  getAlert: asFunction(provideGetAlert),
  getAlerts: asFunction(provideGetAlerts),
  createAlertEvent: asFunction(provideCreateAlertEvent),
  runHandlersOnAlert: asFunction(provideRunHandlersOnAlert),
};
