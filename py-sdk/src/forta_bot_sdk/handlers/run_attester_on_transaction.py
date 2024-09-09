import asyncio
from typing import Callable, Tuple
from web3 import AsyncWeb3
from ..utils import assert_exists, Logger, is_zero_address
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
        filter_addresses = options.get('filter_addresses')

        transaction, debug_trace = await asyncio.gather(*[
            get_transaction(chain_id, tx_hash, provider),
            get_debug_trace_transaction(chain_id, tx_hash, provider)
        ])
        traces, logs = debug_trace
        block = {'number': transaction.block_number,
                 'hash': transaction.block_hash}
        transaction_event = create_transaction_event(
            transaction, block, chain_id, traces, logs)

        if filter_addresses and len(filter_addresses.keys() & transaction_event.addresses.keys()) == 0:
            # if the tx doesn't contain any of the specified addresses being filtered for, skip it
            result = None
        elif is_zero_address(transaction.from_):
            # we ignore any transactions where tx.from is zero address (typically seen for polygon chain)
            # see https://ethereum.stackexchange.com/questions/149078/what-is-this-transaction-with-no-tx-fee-and-from-to-the-null-address
            result = {'risk_score': 0, 'metadata': {
                'reason': 'ignoring due to tx.from being zero address'}}
        else:
            result = await attest_transaction(transaction_event)

        if result:
            logger.log(
                f'{tx_hash}, {result["risk_score"]}, {result["metadata"]}')

        return tx_hash, result

    return run_attester_on_transaction
