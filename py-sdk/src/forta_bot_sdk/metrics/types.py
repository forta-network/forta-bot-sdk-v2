
from typing import TypedDict


class ChainMetrics(TypedDict):
  chain_id: int
  data_points: dict[str, list[int]]

MetricsData = dict[str, list[int]]