import asyncio
from typing import Callable, Optional, Tuple
from web3 import AsyncWeb3
from ..utils import assert_exists, Logger, is_zero_address, format_exception, ProcessWorkQueue, WriteAttestationsToFile
from ..blocks import GetBlockWithTransactions
from ..transactions import CreateTransactionEvent
from ..traces import GetDebugTraceBlock
from ..common import RunAttesterOptions, AttestTransactionResult

RunAttesterOnBlock = Callable[[str | int, RunAttesterOptions,
                               AsyncWeb3, int, Optional[bool]], Tuple[list[Tuple[str, AttestTransactionResult]], list[Tuple[str, Exception]]]]


def provide_run_attester_on_block(
    get_block_with_transactions: GetBlockWithTransactions,
    get_debug_trace_block: GetDebugTraceBlock,
    create_transaction_event: CreateTransactionEvent,
    write_attestations_to_file: WriteAttestationsToFile,
    process_work_queue: ProcessWorkQueue,
    logger: Logger,
) -> RunAttesterOnBlock:
    assert_exists(get_block_with_transactions, 'get_block_with_transactions')
    assert_exists(get_debug_trace_block, 'get_debug_trace_block')
    assert_exists(create_transaction_event, 'create_transaction_event')
    assert_exists(process_work_queue, 'process_work_queue')
    assert_exists(logger, 'logger')

    async def run_attester_on_block(
            block_number: int,
            options: RunAttesterOptions,
            provider: AsyncWeb3,
            chain_id: int,
            results=[],
            errors=[]
    ) -> Tuple[list[Tuple[str, AttestTransactionResult]], list[Tuple[str, Exception]]]:
        attest_transaction = options.get('attest_transaction')
        assert_exists(attest_transaction, 'attest_transaction')
        filter_addresses = options.get('filter_addresses')

        try:
            block, debug_traces = await asyncio.gather(*[
                get_block_with_transactions(chain_id, block_number, provider),
                get_debug_trace_block(chain_id, block_number, provider)
            ])
        except Exception as e:
            errors.append((block_number, e))
            logger.error(f'{block_number}, {format_exception(e)}', True)
            return results, errors

        num_workers = 5
        queue = asyncio.Queue()
        for i in range(len(block.transactions)):
            queue.put_nowait(i)

        async def tx_worker(queue):
            while True:
                i = await queue.get()
                try:
                    transaction = block.transactions[i]
                    traces, logs = debug_traces[i]
                    tx_event = create_transaction_event(
                        transaction, block, chain_id, traces, logs)
                    # if the tx doesn't contain any of the specified addresses being filtered for, skip it
                    if filter_addresses and len(filter_addresses.keys() & tx_event.addresses.keys()) == 0:
                        continue

                    # we skip any transactions where tx.from is zero address (typically seen for polygon chain)
                    # see https://ethereum.stackexchange.com/questions/149078/what-is-this-transaction-with-no-tx-fee-and-from-to-the-null-address
                    if is_zero_address(transaction.from_):
                        result = {'risk_score': 0, 'metadata': {
                            'reason': 'ignoring due to tx.from being zero address'}}
                    else:
                        result = await attest_transaction(tx_event)

                    logger.log(
                        f'{transaction.hash}, {result["risk_score"]}, {result["metadata"]}')
                    results.append((transaction.hash, result))
                except Exception as e:
                    errors.append((transaction.hash, e))
                    logger.error(
                        f'{transaction.hash}, {format_exception(e)}', True)
                queue.task_done()

        # wait until all txs are processed from queue
        await process_work_queue(queue, tx_worker, num_workers)

        # to avoid using too much memory for long block ranges, flush to disk periodically
        if len(results) + len(errors) >= 500_000:
            write_attestations_to_file(options, results, errors)
            results.clear()
            errors.clear()

        return results, errors

    return run_attester_on_block
