import asyncio
from typing import Callable, Tuple
from web3 import AsyncWeb3
from ..common import RunAttesterOptions, AttestTransactionResult, WriteAttestationsToFile
from ..cache import Cache
from ..handlers import RunAttesterOnBlock
from ..utils import assert_exists, Logger, ProcessWorkQueue, now, percent

RunAttesterBlockRange = Callable[[
    str, RunAttesterOptions, AsyncWeb3, int], Tuple[list[Tuple[str, AttestTransactionResult]], list[Tuple[str, Exception]]]]


def provide_run_attester_block_range(
    run_attester_on_block: RunAttesterOnBlock,
    process_work_queue: ProcessWorkQueue,
    write_attestations_to_file: WriteAttestationsToFile,
    cache: Cache,
    logger: Logger,
    attestations_flush_limit: int,
    progress_update_interval_seconds: int
) -> RunAttesterBlockRange:
    assert_exists(run_attester_on_block, 'run_attester_on_block')
    assert_exists(process_work_queue, 'process_work_queue')
    assert_exists(logger, 'logger')
    last_progress_update = now()
    cache_dump_lock = asyncio.Semaphore(1)

    async def run_block_range(block_range: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int, results=[], errors=[]) -> None:

        start_block, end_block = block_range.split("..")
        start_block_number = int(start_block)
        end_block_number = int(end_block)
        if end_block_number <= start_block_number:
            raise Exception("end block must be greater than start block")

        num_workers = options.get('concurrency', 1)
        queue = asyncio.Queue()
        for i in range(start_block_number, end_block_number+1):
            queue.put_nowait(i)

        start_time = now()
        total_blocks = end_block_number - start_block_number

        async def worker(queue):
            nonlocal last_progress_update
            while True:
                block_number = await queue.get()
                await run_attester_on_block(block_number, options, provider, chain_id, results, errors)

                # to avoid using too much memory for long block ranges, flush results to disk periodically
                if len(results) + len(errors) >= attestations_flush_limit:
                    write_attestations_to_file(options, results, errors)
                    results.clear()
                    errors.clear()

                now_timestamp = now()
                # periodically print out a log message for long block ranges as a simple progress update
                if now_timestamp - last_progress_update > progress_update_interval_seconds:
                    completed_blocks = block_number - start_block_number
                    remaining_blocks = total_blocks - completed_blocks
                    percent_complete = percent(
                        completed_blocks/total_blocks)
                    time_elapsed_mins = int(
                        (now_timestamp - start_time)/60)
                    speed = int(completed_blocks/time_elapsed_mins)
                    eta_mins = int(remaining_blocks/speed)
                    progress = f' {percent_complete} complete in {time_elapsed_mins} mins, ETA: {eta_mins} mins'
                    print(
                        f'still running... (on block {block_number}){progress}')
                    # to avoid using too much memory for long block ranges, dump cache to disk periodically
                    async with cache_dump_lock:
                        if now_timestamp - last_progress_update > progress_update_interval_seconds:
                            await cache.dump()
                        last_progress_update = now_timestamp

                queue.task_done()

        await process_work_queue(queue, worker, num_workers)

        return results, errors

    return run_block_range
