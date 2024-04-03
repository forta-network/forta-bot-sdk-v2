import asyncio
from typing import Callable
from web3 import AsyncWeb3
from ..utils import assert_exists, assert_findings, Logger
from ..findings import Finding
from ..transactions import CreateTransactionEvent, GetTransactionReceipt, Receipt
from ..blocks import GetBlockWithTransactions, Block
from ..traces import Trace, GetTraceData
from ..logs import Log
from ..common import ScanEvmOptions

RunHandlersOnTransaction = Callable[[
    str, ScanEvmOptions, AsyncWeb3, int], list[Finding]]


def provide_run_handlers_on_transaction(
    get_transaction_receipt: GetTransactionReceipt,
    get_block_with_transactions: GetBlockWithTransactions,
    get_trace_data: GetTraceData,
    create_transaction_event: CreateTransactionEvent,
    logger: Logger
) -> RunHandlersOnTransaction:
    assert_exists(get_transaction_receipt, 'get_transaction_receipt')
    assert_exists(get_block_with_transactions, 'get_block_with_transactions')
    assert_exists(get_trace_data, 'get_trace_data')
    assert_exists(create_transaction_event, 'create_transaction_event')
    assert_exists(logger, 'logger')

    async def run_handlers_on_transaction(tx_hash: str, options: ScanEvmOptions, provider: AsyncWeb3, chain_id: int) -> list[Finding]:
        handle_transaction = options.get('handle_transaction')
        if not handle_transaction:
            raise Exception("no transaction handler provided")

        coroutines = [get_transaction_receipt(chain_id, tx_hash, provider)]
        if options.get('use_trace_data') == True:
            coroutines.append(get_trace_data(chain_id, tx_hash, provider))
        receipt_and_traces = await asyncio.gather(*coroutines)

        receipt: Receipt = receipt_and_traces[0]
        if not receipt:
            logger.error(
                f'no transaction found for hash {tx_hash} on chain {chain_id}')
            return []

        block: Block = await get_block_with_transactions(chain_id, receipt.block_number, provider)
        tx_hash = tx_hash.lower()
        for tx in block.transactions:
            if tx.hash.lower() == tx_hash:
                transaction = tx
        traces: list[Trace] = receipt_and_traces[1] if len(
            receipt_and_traces) > 1 else []
        transaction_event = create_transaction_event(
            transaction, block, chain_id, traces, receipt.logs)
        findings = await handle_transaction(transaction_event, provider)

        assert_findings(findings)
        logger.log(
            f'{len(findings)} findings for transaction {tx_hash} on chain {chain_id} {findings if len(findings) > 0 else ""}')

        return findings

    return run_handlers_on_transaction
