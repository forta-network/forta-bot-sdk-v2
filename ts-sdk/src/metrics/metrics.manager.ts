import { ChainMetrics, MetricsData } from ".";

export class MetricsManager {
  constructor(
    private readonly metrics: Map<number, MetricsData> = new Map() // TODO use lru-cache
  ) {}

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
