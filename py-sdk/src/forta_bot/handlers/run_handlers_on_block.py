import asyncio
from datetime import datetime
from typing import Callable, Optional
from web3 import AsyncWeb3
from ..utils import assert_exists
from ..findings import Finding
from ..blocks import CreateBlockEvent, GetBlockWithTransactions
from ..transactions import CreateTransactionEvent
from ..traces import Trace, GetTraceData
from ..logs import Log, GetLogsForBlock
from ..metrics import MetricsHelper
from ..common import ScanEvmOptions

RunHandlersOnBlock = Callable[[str | int, ScanEvmOptions, AsyncWeb3.AsyncHTTPProvider, int, Optional[bool]], list[Finding]]


def provide_run_handlers_on_block(
    get_block_with_transactions: GetBlockWithTransactions,
    get_trace_data: GetTraceData,
    get_logs_for_block: GetLogsForBlock,
    create_block_event: CreateBlockEvent,
    create_transaction_event: CreateTransactionEvent,
    metrics_helper: MetricsHelper
) -> RunHandlersOnBlock:
  assert_exists(get_block_with_transactions, 'get_block_with_transactions')
  assert_exists(get_trace_data, 'get_block_with_transactions')
  assert_exists(get_logs_for_block, 'get_logs_for_block')
  assert_exists(create_block_event, 'create_block_event')
  assert_exists(create_transaction_event, 'create_transaction_event')
  assert_exists(metrics_helper, 'metrics_helper')

  async def run_handlers_on_block(
      block_hash_or_number: str | int,
      options: ScanEvmOptions,
      provider: AsyncWeb3.AsyncHTTPProvider,
      chain_id: int,
      should_stop_on_errors: bool = True) -> list[Finding]:
    handle_block = options.get('handle_block')
    handle_transaction = options.get('handle_transaction')
    if  handle_block is None and handle_transaction is None:
      raise Exception("no block/transaction handler provided")
    
    print(f'fetching block {block_hash_or_number} on chain {chain_id}...')
    block_query_start = metrics_helper.start_block_query_timer(chain_id, block_hash_or_number)
    block = await get_block_with_transactions(block_hash_or_number, provider, chain_id)
    if block is None:
      print(f'no block found for hash/number {block_hash_or_number} on chain {chain_id}')
      return []
    
    block_findings = []
    # run block handler
    if handle_block is not None:
      try:
        block_event = create_block_event(block, chain_id)
        metrics_helper.start_handle_block_timer(chain_id, block_hash_or_number, block_event.block.timestamp)
        block_findings = await handle_block(block_event, provider)
        metrics_helper.end_handle_block_timer(chain_id, block_hash_or_number)

        # TODO assert_findings(block_findings)
        print(f'{len(block_findings)} findings for block {block["hash"]} on chain {chain_id} {block_findings if len(block_findings) > 0 else ""}')
        metrics_helper.report_handle_block_success(chain_id, len(block_findings))
      except Exception as e:
        metrics_helper.report_handle_block_error(chain_id)
        if should_stop_on_errors: raise e
        print(f'{datetime.now().isoformat()}    handle_block {block["hash"]}')
        print (e)
    
    if handle_transaction is None: return block_findings

    tx_findings = []
    coroutines = [get_logs_for_block(block['number'], provider, chain_id)]
    if options.get('use_trace_data') == True:
      coroutines.append(get_trace_data(block['number'], provider, chain_id))
    logs_and_traces = await asyncio.gather(*coroutines)

    # build map of logs for each transaction using block logs
    logs = logs_and_traces[0]
    log_map: dict[str: list[Log]] = {}
    for log in logs:
      if log.get('transaction_hash') is None: continue
      tx_hash = log['transaction_hash'].lower()
      if tx_hash not in log_map: log_map[tx_hash] = []
      log_map[tx_hash].append(Log(log))
    
    # build map of traces for each transaction using block traces
    traces = logs_and_traces[1] if len(logs_and_traces) > 1 else []
    trace_map: dict[str: list[Trace]] = {}
    for trace in traces:
      if trace.get('transaction_hash') is None: continue
      tx_hash = trace['transaction_hash'].lower()
      if tx_hash not in trace_map: trace_map[tx_hash] = []
      trace_map[tx_hash].append(Trace(trace))
    
    # run transaction handler on all block transactions
    block_timestamp = int(block['timestamp'], 0)
    for transaction in block['transactions']:
      tx_hash = transaction['hash'].lower()
      try:
        tx_event = create_transaction_event(transaction, block, chain_id, trace_map.get(tx_hash), log_map.get(tx_hash))
        metrics_helper.start_handle_transaction_timer(chain_id, tx_hash, block_query_start, block_timestamp)
        findings = await handle_transaction(tx_event, provider)
        metrics_helper.end_handle_transaction_timer(chain_id, tx_hash)
        tx_findings.extend(findings)

        # TODO assert_findings(findings)
        print(f'{len(findings)} findings for transaction {tx_hash} on chain {chain_id} {findings if len(findings) > 0 else ""}')
        metrics_helper.report_handle_transaction_success(chain_id, len(findings))
      except Exception as e:
        metrics_helper.report_handle_transaction_error(chain_id)
        if should_stop_on_errors: raise e
        print(f'{datetime.now().isoformat()}    handle_transaction {tx_hash}')
        print(e)
    
    return block_findings + tx_findings

  return run_handlers_on_block