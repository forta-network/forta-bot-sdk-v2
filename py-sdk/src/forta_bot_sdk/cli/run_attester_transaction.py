import asyncio
from typing import Callable, Tuple
from web3 import AsyncWeb3
from ..handlers import RunAttesterOnTransaction
from ..common import RunAttesterOptions, AttestTransactionResult
from ..utils import Logger, assert_exists, ProcessWorkQueue

RunAttesterTransaction = Callable[[
    str, RunAttesterOptions, AsyncWeb3, int], Tuple[list[Tuple[str, AttestTransactionResult]], list[Tuple[str, Exception]]]]


def provide_run_attester_transaction(
    run_attester_on_transaction: RunAttesterOnTransaction,
    process_work_queue: ProcessWorkQueue,
    logger: Logger
) -> RunAttesterTransaction:
    assert_exists(run_attester_on_transaction, 'run_attester_on_transaction')
    assert_exists(process_work_queue, 'process_work_queue')
    assert_exists(logger, 'logger')

    async def run_attester_transaction(tx_hash: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int, results=[], errors=[]) -> None:
        tx_hashes = [tx_hash]
        # support for specifying multiple transactions with comma-delimited list
        if tx_hash.find(",") >= 0:
            tx_hashes = tx_hash.split(",")

        num_workers = options.get('concurrency', 1)
        queue = asyncio.Queue()
        for tx_hash in tx_hashes:
            queue.put_nowait(tx_hash)

        async def worker(queue):
            while True:
                tx_hash = await queue.get()
                await run_attester_on_transaction(tx_hash, options, provider, chain_id, results, errors)
                queue.task_done()

        await process_work_queue(queue, worker, num_workers)

        return results, errors

    return run_attester_transaction
