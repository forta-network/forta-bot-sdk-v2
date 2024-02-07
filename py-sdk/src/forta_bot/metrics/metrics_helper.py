from datetime import datetime
from .metrics_manager import MetricsManager
from .constants import MetricName

HANDLE_ALERT_CHAIN_ID = 0

class MetricsHelper:
  def __init__(self, metrics_manager: MetricsManager):
    self.timers: dict[str, int] = {}
    self.json_rpc_request_id: int = 0
    self.metrics_manager = metrics_manager

  def report_findings(self, chain_id: int, value: int):
    if value == 0: return
    self.metrics_manager.report_metric(chain_id, MetricName.FINDING_COUNT, value)

  # returns number of MILLISECONDS since epoch
  def now(self) -> int:
    return int(datetime.now().timestamp()*1000)

  """""""""""""""""""""""""""
  HANDLE BLOCK METRICS
  """""""""""""""""""""""""""

  def report_handle_block_request(self, chain_id: int):
    self.metrics_manager.report_metric(chain_id, MetricName.HANDLE_BLOCK_REQUEST_COUNT, 1)

  def start_block_query_timer(self, chain_id: int, block_hash_or_number: int | str) -> int:
    now = self.now()
    self.timers[f'{self.block_key(chain_id, block_hash_or_number)}-query'] = now
    return now
  
  def end_block_query_timer(self, chain_id: int, block_hash_or_number: int | str):
    timer_key = f'{self.block_key(chain_id, block_hash_or_number)}-query'
    start_time = self.timers[timer_key]
    del self.timers[timer_key]
    self.metrics_manager.report_metric(chain_id, MetricName.HANDLE_BLOCK_EVENT_AGE, self.now() - start_time)

  def report_handle_block_block_age(self, chain_id: int, block_timestamp_seconds: int):
    self.metrics_manager.report_metric(chain_id, MetricName.HANDLE_BLOCK_BLOCK_AGE, self.now() - block_timestamp_seconds*1000)
  
  def start_handle_block_timer(self, chain_id: int, block_hash_or_number: int | str, block_timestamp_seconds: int):
    self.end_block_query_timer(chain_id, block_hash_or_number)
    self.report_handle_block_block_age(chain_id, block_timestamp_seconds)
    self.report_handle_block_request(chain_id)
    self.timers[self.block_key(chain_id, block_hash_or_number)] = self.now()
  
  def end_handle_block_timer(self, chain_id: int, block_hash_or_number: int | str):
    block_key = self.block_key(chain_id, block_hash_or_number)
    start_time = self.timers[block_key]
    del self.timers[block_key]
    self.metrics_manager.report_metric(chain_id, MetricName.HANDLE_BLOCK_LATENCY, self.now() - start_time)
  
  def report_handle_block_success(self, chain_id, findings_count: int):
    self.report_findings(chain_id, findings_count)
    self.metrics_manager.report_metric(chain_id, MetricName.HANDLE_BLOCK_SUCCESS_COUNT, 1)
  
  def report_handle_block_error(self, chain_id: int):
    self.metrics_manager.report_metric(chain_id, MetricName.HANDLE_BLOCK_ERROR_COUNT, 1)
  
  def block_key(self, chain_id: int, block_hash_or_number: int| str) -> str:
    return f'{chain_id}-{block_hash_or_number}'
  
  """""""""""""""""""""""""""
  HANDLE TRANSACTION METRICS
  """""""""""""""""""""""""""

  def report_handle_transaction_request(self, chain_id: int):
    self.metrics_manager.report_metric(chain_id, MetricName.HANDLE_TX_REQUEST_COUNT, 1)

  def report_handle_transaction_success(self, chain_id: int, findings_count: int):
    self.report_findings(chain_id, findings_count)
    self.metrics_manager.report_metric(chain_id, MetricName.HANDLE_TX_SUCCESS_COUNT, 1)

  def report_handle_transaction_block_event_age(self, chain_id: int, block_query_start_time: int):
    self.metrics_manager.report_metric(chain_id, MetricName.HANDLE_TX_EVENT_AGE, self.now() - block_query_start_time)
  
  def report_handle_transaction_block_age(self, chain_id: int, block_timestamp_seconds: int):
    self.metrics_manager.report_metric(chain_id, MetricName.HANDLE_TX_BLOCK_AGE, self.now() - block_timestamp_seconds*1000)

  def start_handle_transaction_timer(self, chain_id: int, tx_hash: str, block_query_start_time: int, block_timestamp_seconds: int):
    self.report_handle_transaction_block_event_age(chain_id, block_query_start_time)
    self.report_handle_transaction_block_age(chain_id, block_timestamp_seconds)
    self.report_handle_transaction_request(chain_id)
    self.timers[self.tx_key(chain_id, tx_hash)] = self.now()
  
  def end_handle_transaction_timer(self, chain_id: int, tx_hash: str):
    tx_key = self.tx_key(chain_id, tx_hash)
    start_time = self.timers[tx_key]
    del self.timers[tx_key]
    self.metrics_manager.report_metric(chain_id, MetricName.HANDLE_TX_LATENCY, self.now() - start_time)
  
  def report_handle_transaction_error(self, chain_id: int):
    self.metrics_manager.report_metric(chain_id, MetricName.HANDLE_TX_ERROR_COUNT, 1)

  def tx_key(self, chain_id: int, tx_hash: str):
    return f'{chain_id}-{tx_hash}'

  """""""""""""""""""""""""""
  HANDLE ALERT METRICS
  """""""""""""""""""""""""""

  def report_handle_alert_request(self):
    self.metrics_manager.report_metric(HANDLE_ALERT_CHAIN_ID, MetricName.HANDLE_ALERT_REQUEST_COUNT, 1)

  def report_handle_alert_success(self, findings_count: int):
    self.report_findings(HANDLE_ALERT_CHAIN_ID, findings_count)
    self.metrics_manager.report_metric(HANDLE_ALERT_CHAIN_ID, MetricName.HANDLE_ALERT_SUCCESS_COUNT, 1)
  
  def report_handle_alert_error(self):
    self.metrics_manager.report_metric(HANDLE_ALERT_CHAIN_ID, MetricName.HANDLE_ALERT_ERROR_COUNT, 1)

  def start_handle_alert_timer(self, alert_hash: str):
    self.report_handle_alert_request()
    self.timers[alert_hash] = self.now()
  
  def end_handle_alert_timer(self, alert_hash: str):
    start_time = self.timers[alert_hash]
    del self.timers[alert_hash]
    self.metrics_manager.report_metric(HANDLE_ALERT_CHAIN_ID, MetricName.HANDLE_ALERT_LATENCY, self.now() - start_time)
  
  """""""""""""""""""""""""""
  JSON RPC METRICS
  """""""""""""""""""""""""""

  def report_json_rpc_request(self, chain_id: int, method_name: str):
    self.metrics_manager.report_metric(chain_id, f'{MetricName.JSON_RPC_REQUEST_COUNT.value}.{method_name}', 1)
  
  def report_json_rpc_success(self, chain_id: int, method_name: str):
    self.metrics_manager.report_metric(chain_id, f'{MetricName.JSON_RPC_SUCCESS_COUNT.value}.{method_name}', 1)

  def start_json_rpc_timer(self, chain_id: int, method_name: str):
    self.report_json_rpc_request(chain_id, method_name)
    self.json_rpc_request_id = self.json_rpc_request_id+1
    self.timers[f'rpc-{self.json_rpc_request_id}'] = self.now()
    return self.json_rpc_request_id
  
  def end_json_rpc_timer(self, request_id: int, chain_id: int, method_name: str):
    request_key = f'rpc-{request_id}'
    start_time = self.timers[request_key]
    del self.timers[request_key]
    self.metrics_manager.report_metric(chain_id, f'{MetricName.JSON_RPC_LATENCY.value}.{method_name}', self.now()-start_time)
    self.report_json_rpc_success(chain_id, method_name)
  
  def report_json_rpc_error(self, chain_id: int, method_name: str):
    self.metrics_manager.report_metric(chain_id, f'{MetricName.JSON_RPC_ERROR_COUNT.value}.{method_name}', 1)
  
  def report_json_rpc_throttled(self, chain_id: int, method_name: str):
    self.metrics_manager.report_metric(chain_id, f'{MetricName.JSON_RPC_THROTTLED_COUNT.value}.{method_name}', 1)