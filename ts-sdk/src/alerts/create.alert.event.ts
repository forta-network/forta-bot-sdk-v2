import { Alert } from "./alert";
import { AlertEvent } from "./alert.event";

// creates a Forta AlertEvent from a public alert object
export type CreateAlertEvent = (alert: Alert) => AlertEvent;

export function provideCreateAlertEvent(): CreateAlertEvent {
  return function createAlertEvent(alert: Alert) {
    return new AlertEvent(alert);
  };
}
