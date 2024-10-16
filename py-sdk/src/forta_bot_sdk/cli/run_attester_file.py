import asyncio
from typing import Callable, Tuple
from web3 import AsyncWeb3
from ..common import RunAttesterOptions, AttestTransactionResult
from ..handlers import RunAttesterOnTransaction
from ..providers import GetProvider
from ..utils import assert_exists, Logger, ProcessWorkQueue

RunAttesterFile = Callable[[[
    str, RunAttesterOptions, AsyncWeb3, int]], Tuple[list[Tuple[str, AttestTransactionResult]], list[Tuple[str, Exception]]]]


def provide_run_attester_file(
    run_attester_on_transaction: RunAttesterOnTransaction,
    get_provider: GetProvider,
    process_work_queue: ProcessWorkQueue,
    logger: Logger
) -> RunAttesterFile:
    assert_exists(run_attester_on_transaction, 'run_attester_on_transaction')
    assert_exists(get_provider, 'get_provider')
    assert_exists(process_work_queue, 'process_work_queue')
    assert_exists(logger, 'logger')

    async def run_attester_file(filename: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int, results=[], errors=[]):
        num_workers = options.get('concurrency', 1)
        queue = asyncio.Queue()
        with open(filename) as file:
            for line in file:
                queue.put_nowait(line.strip())

        async def worker(queue):
            while True:
                line = await queue.get()
                tx_chain_id = chain_id
                tx_provider = provider
                # optionally, the chain id can be specified for each tx
                if "," in line:
                    tx_hash, tx_chain_id = line.split(",")
                    tx_hash = tx_hash.strip()
                    tx_chain_id = int(tx_chain_id.strip())
                    tx_provider = await get_provider({"local_rpc_url": str(tx_chain_id)})
                await run_attester_on_transaction(tx_hash, options, tx_provider, tx_chain_id, results, errors)
                queue.task_done()

        await process_work_queue(queue, worker, num_workers)

        return results, errors

    return run_attester_file
