import asyncio
from typing import Callable, Tuple
from web3 import AsyncWeb3
from ..utils import assert_exists, Logger
from ..transactions import GetTransaction, CreateTransactionEvent
from ..traces import GetDebugTraceTransaction
from ..common import RunAttesterOptions, AttestTransactionResult

RunAttesterOnTransaction = Callable[[
    str, RunAttesterOptions, AsyncWeb3, int], Tuple[str, AttestTransactionResult]]


def provide_run_attester_on_transaction(
    get_transaction: GetTransaction,
    get_debug_trace_transaction: GetDebugTraceTransaction,
    create_transaction_event: CreateTransactionEvent,
    logger: Logger
) -> RunAttesterOnTransaction:
    assert_exists(get_transaction, 'get_transaction')
    assert_exists(get_debug_trace_transaction,
                  'get_debug_trace_transaction')
    assert_exists(create_transaction_event, 'create_transaction_event')
    assert_exists(logger, 'logger')

    async def run_attester_on_transaction(tx_hash: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int) -> AttestTransactionResult:
        attest_transaction = options.get('attest_transaction')
        assert_exists(attest_transaction, 'attest_transaction')

        transaction, debug_trace = await asyncio.gather(*[
            get_transaction(chain_id, tx_hash, provider),
            get_debug_trace_transaction(chain_id, tx_hash, provider)
        ])
        traces, logs = debug_trace

        block = {'number': transaction.block_number,
                 'hash': transaction.block_hash}
        transaction_event = create_transaction_event(
            transaction, block, chain_id, traces, logs)
        result = await attest_transaction(transaction_event)

        logger.log(f'{tx_hash}, {result["risk_score"]}, {result["metadata"]}')
        return tx_hash, result

    return run_attester_on_transaction
