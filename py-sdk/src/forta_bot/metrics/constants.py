
from enum import Enum

class MetricName(Enum):
  FINDING_COUNT = "finding" # number of findings emitted
  HANDLE_TX_REQUEST_COUNT = "tx.request" # number of times handle_transaction was invoked
  HANDLE_TX_LATENCY = "tx.latency" # how long handle_transaction took to execute
  HANDLE_TX_SUCCESS_COUNT = "tx.success" # number of times handle_transaction completed execution
  HANDLE_TX_ERROR_COUNT = "tx.error" # number of times handle_transaction threw an error
  HANDLE_TX_BLOCK_AGE = "tx.block.age" # block.timestamp till start of handle_transaction
  HANDLE_TX_EVENT_AGE = "tx.event.age" # block query timestamp till start of handle_transaction
  HANDLE_BLOCK_REQUEST_COUNT = "block.request" # number of times handle_block was invoked
  HANDLE_BLOCK_LATENCY = "block.latency" # how long handle_block took to execute
  HANDLE_BLOCK_SUCCESS_COUNT = "block.success" # nubmer of times handle_block completed execution
  HANDLE_BLOCK_ERROR_COUNT = "block.error" # number of times handle_block threw an error
  HANDLE_BLOCK_BLOCK_AGE = "block.block.age" # block.timestamp till start of handle_block
  HANDLE_BLOCK_EVENT_AGE = "block.event.age" # block query timestamp till start of handle_block
  JSON_RPC_LATENCY = "jsonrpc.latency" # how long a json-rpc network call took
  JSON_RPC_REQUEST_COUNT = "jsonrpc.request" # number of times a json-rpc request was made
  JSON_RPC_SUCCESS_COUNT = "jsonrpc.success" # number of times json-rpc request completed
  JSON_RPC_ERROR_COUNT = "jsonrpc.error" # number of times json-rpc request threw an error
  JSON_RPC_THROTTLED_COUNT = "jsonrpc.throttled" # number of times json-rpc request was throttled
  HANDLE_ALERT_REQUEST_COUNT = "combiner.request" # number of times handle_alert was invoked
  HANDLE_ALERT_LATENCY = "combiner.latency" # how long handle_alert took to execute
  HANDLE_ALERT_SUCCESS_COUNT = "combiner.success" # number of times handle_alert completed execution
  HANDLE_ALERT_ERROR_COUNT = "combiner.error" # number of times handle_alert threw an error
  # HANDLE_ALERT_DROP_COUNT = "combiner.drop" # number of times handle_alert dropped alerts