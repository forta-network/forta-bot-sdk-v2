import { JsonRpcProvider } from "ethers";
import { AlertEvent, AlertSubscription } from "../alerts";
import { BlockEvent } from "../blocks";
import { Finding } from "../findings";
import { TransactionEvent } from "../transactions";

export interface InitializeResponse {
  alertConfig: {
    subscriptions: AlertSubscription[];
  };
}

export type Initialize = () => Promise<InitializeResponse | void>;
export type HealthCheck = () => Promise<string[] | void>;
export type HandleTransaction = (
  txEvent: TransactionEvent,
  provider: JsonRpcProvider
) => Promise<Finding[]>;
export type HandleBlock = (
  blockEvent: BlockEvent,
  provider: JsonRpcProvider
) => Promise<Finding[]>;
export type HandleAlert = (alertEvent: AlertEvent) => Promise<Finding[]>;
