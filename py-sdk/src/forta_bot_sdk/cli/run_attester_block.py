import asyncio
from typing import Callable, Tuple
from web3 import AsyncWeb3
from ..utils import assert_exists, Logger
from ..common import RunAttesterOptions, AttestTransactionResult
from ..handlers import RunAttesterOnBlock

RunAttesterBlock = Callable[[str, RunAttesterOptions, AsyncWeb3, int],
                            Tuple[list[Tuple[str, AttestTransactionResult]], list[Tuple[str, Exception]]]]


def provide_run_attester_block(
    run_attester_on_block: RunAttesterOnBlock,
    logger: Logger
) -> RunAttesterBlock:
    assert_exists(run_attester_on_block, 'run_attester_on_block')
    assert_exists(logger, 'logger')

    async def run_attester_block(block_number: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int, results=[], errors=[]) -> None:
        block_numbers = [block_number]
        # support for specifying multiple blocks with comma-delimited list
        if block_number.find(",") >= 0:
            block_numbers = block_number.split(",")

        batch_size = options.get('concurrency', 1)
        # attest the blocks in batches
        for i in range(0, len(block_numbers), batch_size):
            block_batch = block_numbers[i: min(
                i+batch_size, len(block_numbers))]
            coroutines = [run_attester_on_block(int(
                block), options, provider, chain_id, results, errors) for block in block_batch]
            await asyncio.gather(*coroutines)

        return results, errors

    return run_attester_block
