from typing import Callable, Tuple
from web3 import AsyncWeb3
from ..common import RunAttesterOptions, AttestTransactionResult
from ..handlers import RunAttesterOnBlock
from ..utils import assert_exists, format_exception, Logger

RunAttesterBlockRange = Callable[[
    str, RunAttesterOptions, AsyncWeb3, int], Tuple[list[Tuple[str, AttestTransactionResult]], list[Tuple[str, Exception]]]]


def provide_run_attester_block_range(
    run_attester_on_block: RunAttesterOnBlock,
    logger: Logger
):
    assert_exists(run_attester_on_block, 'run_attester_on_block')
    assert_exists(logger, 'logger')

    async def run_block_range(block_range: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int, results=[], errors=[]) -> None:
        start_block, end_block = block_range.split("..")
        start_block_number = int(start_block)
        end_block_number = int(end_block)
        if end_block_number <= start_block_number:
            raise Exception("end block must be greater than start block")

        for block_number in range(start_block_number, end_block_number+1):
            try:
                results, errors = await run_attester_on_block(block_number, options, provider, chain_id, results, errors)
            except Exception as e:
                errors.append((block_number, e))
                logger.error(f'{block_number}, {format_exception(e)}', True)

        return results, errors

    return run_block_range
