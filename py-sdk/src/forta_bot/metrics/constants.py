
from enum import Enum


class MetricName(Enum):
    # number of findings emitted
    FINDING_COUNT = "finding"
    # number of times handle_transaction was invoked
    HANDLE_TX_REQUEST_COUNT = "tx.request"
    # how long handle_transaction took to execute
    HANDLE_TX_LATENCY = "tx.latency"
    # number of times handle_transaction completed execution
    HANDLE_TX_SUCCESS_COUNT = "tx.success"
    # number of times handle_transaction threw an error
    HANDLE_TX_ERROR_COUNT = "tx.error"
    # block.timestamp till start of handle_transaction
    HANDLE_TX_BLOCK_AGE = "tx.block.age"
    # block query timestamp till start of handle_transaction
    HANDLE_TX_EVENT_AGE = "tx.event.age"
    # number of times handle_block was invoked
    HANDLE_BLOCK_REQUEST_COUNT = "block.request"
    # how long handle_block took to execute
    HANDLE_BLOCK_LATENCY = "block.latency"
    # nubmer of times handle_block completed execution
    HANDLE_BLOCK_SUCCESS_COUNT = "block.success"
    # number of times handle_block threw an error
    HANDLE_BLOCK_ERROR_COUNT = "block.error"
    # block.timestamp till start of handle_block
    HANDLE_BLOCK_BLOCK_AGE = "block.block.age"
    # block query timestamp till start of handle_block
    HANDLE_BLOCK_EVENT_AGE = "block.event.age"
    # how long a json-rpc network call took
    JSON_RPC_LATENCY = "jsonrpc.latency"
    # number of times a json-rpc request was made
    JSON_RPC_REQUEST_COUNT = "jsonrpc.request"
    # number of times json-rpc request completed
    JSON_RPC_SUCCESS_COUNT = "jsonrpc.success"
    # number of times json-rpc request threw an error
    JSON_RPC_ERROR_COUNT = "jsonrpc.error"
    # number of times json-rpc request was throttled
    JSON_RPC_THROTTLED_COUNT = "jsonrpc.throttled"
    # how long a json-rpc cache network call took
    JSON_RPC_CACHE_LATENCY = "jsonrpc.cache.latency"
    # number of times a json-rpc cache request was made
    JSON_RPC_CACHE_REQUEST_COUNT = "jsonrpc.cache.request"
    # number of times json-rpc cache request completed (i.e. cache hit)
    JSON_RPC_CACHE_SUCCESS_COUNT = "jsonrpc.cache.success"
    # number of times json-rpc cache request threw an error (i.e. cache miss)
    JSON_RPC_CACHE_ERROR_COUNT = "jsonrpc.cache.error"
    # number of times handle_alert was invoked
    HANDLE_ALERT_REQUEST_COUNT = "combiner.request"
    # how long handle_alert took to execute
    HANDLE_ALERT_LATENCY = "combiner.latency"
    # number of times handle_alert completed execution
    HANDLE_ALERT_SUCCESS_COUNT = "combiner.success"
    # number of times handle_alert threw an error
    HANDLE_ALERT_ERROR_COUNT = "combiner.error"
    # HANDLE_ALERT_DROP_COUNT = "combiner.drop" # number of times handle_alert dropped alerts
