from typing import Callable, Tuple
from web3 import AsyncWeb3
from ..utils import assert_exists, format_exception, Logger
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
        blocks = [block_number]
        # support for specifying multiple blocks with comma-delimited list
        if block_number.find(",") >= 0:
            blocks = block_number.split(",")

        for block in blocks:
            try:
                results, errors = await run_attester_on_block(int(block), options, provider, chain_id, results, errors)
            except Exception as e:
                # catch any errors here thrown while fetching block data
                errors.append((block, e))
                logger.error(f'{block}, {format_exception(e)}', True)

        return results, errors

    return run_attester_block
