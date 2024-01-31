import { MetricsManager } from "./metrics.manager";

export type MetricDataKey =
  | "finding"
  | "tx.request"
  | "tx.latency"
  | "tx.error"
  | "tx.success"
  | "tx.block.age"
  | "tx.event.age"
  | "block.block.age"
  | "block.event.age"
  | "block.request"
  | "block.latency"
  | "block.error"
  | "block.success"
  | "jsonrpc.latency"
  | "jsonrpc.request"
  | "jsonrpc.success"
  | "jsonrpc.throttled"
  | "combiner.request"
  | "combiner.latency"
  | "combiner.error"
  | "combiner.success"
  | "combiner.drop";

export type ChainMetrics = {
  chainId: number;
  dataPoints: { [k in MetricDataKey]: number };
};

export type Metrics = [ChainMetrics?];

export { MetricsManager };
