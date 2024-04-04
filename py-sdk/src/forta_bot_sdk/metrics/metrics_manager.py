from .types import MetricsData, ChainMetrics
from .constants import MetricName

class MetricsManager:
  def __init__(self):
    self.metrics: dict[int, MetricsData] = {}
  
  def flush_metrics(self) -> list[ChainMetrics]:
    chain_metrics: list[ChainMetrics] = []
    for chain_id, chain_id_metrics in self.metrics.items():
      data_points: dict[str, list[int]] = {}
      for metric_name, metric_data in chain_id_metrics.items():
        data_points[metric_name] = metric_data
      chain_metrics.append({'chainId': chain_id, 'dataPoints': data_points})
    self.metrics.clear()
    return chain_metrics
  
  def report_metric(self, chain_id: int, metric: str, value: int):
    if type(metric) == MetricName:
      metric = metric.value
      
    if chain_id not in self.metrics:
      self.metrics[chain_id] = {}
    
    if metric not in self.metrics[chain_id]:
      self.metrics[chain_id][metric] = [value]
    else:
      self.metrics[chain_id][metric].append(value)