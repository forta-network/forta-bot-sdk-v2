import { MetricDataKey, Metrics } from ".";

export class MetricsManager {
  constructor(private readonly metrics: { [chainId: number]: object } = {}) {}

  public flushMetrics(): Metrics {
    return [];
  }

  // private reportMetric(chainId: number, metric: MetricDataKey, value: number) {
  //   if (!this.metrics[chainId]) {
  //     this.metrics[chainId] = {};
  //   }
  //   this.metrics[chainId][metric] = value;
  // }
}
