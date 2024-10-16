import asyncio
from typing import Callable, Tuple
from web3 import AsyncWeb3
from ..utils import assert_exists, Logger, ProcessWorkQueue
from ..common import RunAttesterOptions, AttestTransactionResult
from ..handlers import RunAttesterOnBlock

RunAttesterBlock = Callable[[str, RunAttesterOptions, AsyncWeb3, int],
                            Tuple[list[Tuple[str, AttestTransactionResult]], list[Tuple[str, Exception]]]]


def provide_run_attester_block(
    run_attester_on_block: RunAttesterOnBlock,
    process_work_queue: ProcessWorkQueue,
    logger: Logger
) -> RunAttesterBlock:
    assert_exists(run_attester_on_block, 'run_attester_on_block')
    assert_exists(process_work_queue, 'process_work_queue')
    assert_exists(logger, 'logger')

    async def run_attester_block(block_number: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int, results=[], errors=[]) -> None:
        block_numbers = [block_number]
        # support for specifying multiple blocks with comma-delimited list
        if block_number.find(",") >= 0:
            block_numbers = block_number.split(",")

        num_workers = options.get('concurrency', 1)
        queue = asyncio.Queue()
        for block_number in block_numbers:
            queue.put_nowait(int(block_number))

        async def worker(queue):
            while True:
                block_number = await queue.get()
                await run_attester_on_block(block_number, options, provider, chain_id, results, errors)
                queue.task_done()

        await process_work_queue(queue, worker, num_workers)

        return results, errors

    return run_attester_block
