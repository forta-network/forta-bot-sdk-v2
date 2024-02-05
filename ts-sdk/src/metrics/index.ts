import { MetricsHelper } from "./metrics.helper";
import { MetricsManager } from "./metrics.manager";

export enum MetricName {
  FINDING_COUNT = "finding", // number of findings emitted
  HANDLE_TX_REQUEST_COUNT = "tx.request", // number of times handleTransaction was invoked
  HANDLE_TX_LATENCY = "tx.latency", // how long handleTransaction took to execute
  HANDLE_TX_SUCCESS_COUNT = "tx.success", // number of times handleTransaction completed execution
  HANDLE_TX_ERROR_COUNT = "tx.error", // number of times handleTransaction threw an error
  HANDLE_TX_BLOCK_AGE = "tx.block.age", // block.timestamp till start of handleTransaction
  HANDLE_TX_EVENT_AGE = "tx.event.age", // block query timestamp till start of handleTransaction
  HANDLE_BLOCK_REQUEST_COUNT = "block.request", // number of times handleBlock was invoked
  HANDLE_BLOCK_LATENCY = "block.latency", // how long handleBlock took to execute
  HANDLE_BLOCK_SUCCESS_COUNT = "block.success", // number of times handleBlock completed execution
  HANDLE_BLOCK_ERROR_COUNT = "block.error", // number of times handleBlock threw an error
  HANDLE_BLOCK_BLOCK_AGE = "block.block.age", // block.timestamp till start of handleBlock
  HANDLE_BLOCK_EVENT_AGE = "block.event.age", // block query timestamp till start of handleBlock
  JSON_RPC_LATENCY = "jsonrpc.latency", // how long a json-rpc network call took
  JSON_RPC_REQUEST_COUNT = "jsonrpc.request", // number of times a json-rpc request was made
  JSON_RPC_SUCCESS_COUNT = "jsonrpc.success", // number of times json-rpc request completed
  JSON_RPC_ERROR_COUNT = "jsonrpc.error", // number of times json-rpc request threw an error
  JSON_RPC_THROTTLED_COUNT = "jsonrpc.throttled", // number of times json-rpc request was throttled
  HANDLE_ALERT_REQUEST_COUNT = "combiner.request", // number of times handleAlert was invoked
  HANDLE_ALERT_LATENCY = "combiner.latency", // how long handleAlert took to execute
  HANDLE_ALERT_SUCCESS_COUNT = "combiner.success", // number of times handleAlert completed execution
  HANDLE_ALERT_ERROR_COUNT = "combiner.error", // number of times handleAlert threw an error
  // HANDLE_ALERT_DROP_COUNT = "combiner.drop", // number of times handleAlert dropped alerts
}

export type ChainMetrics = {
  chainId: number;
  dataPoints: { [metricName: string]: number[] };
};

export type MetricsData = Map<string, number[]>;

export { MetricsManager, MetricsHelper };
