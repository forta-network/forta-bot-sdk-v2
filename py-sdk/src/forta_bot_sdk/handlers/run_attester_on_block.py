import asyncio
from typing import Callable, Optional, Tuple
from web3 import AsyncWeb3
from ..utils import assert_exists, Logger, is_zero_address
from ..blocks import GetBlockWithTransactions
from ..transactions import CreateTransactionEvent
from ..traces import GetDebugTraceBlock
from ..common import RunAttesterOptions, AttestTransactionResult

RunAttesterOnBlock = Callable[[str | int, RunAttesterOptions,
                               AsyncWeb3, int, Optional[bool]], list[Tuple[str, AttestTransactionResult]]]


def provide_run_attester_on_block(
    get_block_with_transactions: GetBlockWithTransactions,
    get_debug_trace_block: GetDebugTraceBlock,
    create_transaction_event: CreateTransactionEvent,
    logger: Logger,
) -> RunAttesterOnBlock:
    assert_exists(get_block_with_transactions, 'get_block_with_transactions')
    assert_exists(get_debug_trace_block, 'get_debug_trace_block')
    assert_exists(create_transaction_event, 'create_transaction_event')
    assert_exists(logger, 'logger')

    async def run_attester_on_block(
            block_number: int,
            options: RunAttesterOptions,
            provider: AsyncWeb3,
            chain_id: int
    ) -> list[Tuple[str, AttestTransactionResult]]:
        attest_transaction = options.get('attest_transaction')
        assert_exists(attest_transaction, 'attest_transaction')

        block, debug_traces = await asyncio.gather(*[
            get_block_with_transactions(chain_id, block_number, provider),
            get_debug_trace_block(chain_id, block_number, provider)
        ])

        # run attest_transaction on all block transactions
        results = []
        for i in range(len(block.transactions)):
            transaction = block.transactions[i]
            # we skip any transactions where tx.from is zero address (typically seen for polygon chain)
            # see https://ethereum.stackexchange.com/questions/149078/what-is-this-transaction-with-no-tx-fee-and-from-to-the-null-address
            if is_zero_address(transaction.from_):
                result = {'risk_score': 0, 'metadata': {
                    'reason': 'ignoring due to tx.from being zero address'}}
            else:
                traces, logs = debug_traces[i]
                tx_event = create_transaction_event(
                    transaction, block, chain_id, traces, logs)
                result = await attest_transaction(tx_event)

            logger.log(
                f'{transaction.hash}, {result["risk_score"]}, {result["metadata"]}')
            results.append((transaction.hash, result))

        return results

    return run_attester_on_block
