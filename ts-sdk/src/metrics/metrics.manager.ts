import { ChainMetrics, MetricsData } from ".";

export class MetricsManager {
  constructor(private readonly metrics: Map<number, MetricsData> = new Map()) {}

  public flushMetrics(): ChainMetrics[] {
    const chainMetrics: ChainMetrics[] = [];
    for (const [chainId, chainIdMetrics] of this.metrics.entries()) {
      const dataPoints: { [metricName: string]: number[] } = {};
      for (const [metricName, metricData] of chainIdMetrics.entries()) {
        dataPoints[metricName] = metricData;
      }
      chainMetrics.push({ chainId, dataPoints });
    }
    this.metrics.clear();
    return chainMetrics;
  }

  public reportMetric(chainId: number, metric: string, value: number) {
    // TODO if not running health check, then dont store metrics? (so that they dont take up memory for external bots because flushMetrics will never be called)

    if (!this.metrics.has(chainId)) {
      this.metrics.set(chainId, new Map());
    }
    if (!this.metrics.get(chainId)!.has(metric)) {
      this.metrics.get(chainId)!.set(metric, [value]);
    } else {
      this.metrics.get(chainId)!.get(metric)!.push(value);
    }
  }
}
