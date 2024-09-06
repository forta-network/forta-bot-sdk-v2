from typing import Callable, Optional, Tuple
from web3 import AsyncWeb3
from ..utils import assert_exists
from ..common import RunAttesterOptions, AttestTransactionResult
from ..handlers import RunAttesterOnBlock

RunAttesterBlock = Callable[[str, RunAttesterOptions, AsyncWeb3, int],
                            Tuple[list[Tuple[str, AttestTransactionResult]], Optional[Exception]]]


def provide_run_attester_block(
    run_attester_on_block: RunAttesterOnBlock
) -> RunAttesterBlock:
    assert_exists(run_attester_on_block, 'run_attester_on_block')

    async def run_attester_block(block_number: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int, results=[]) -> None:
        blocks = [block_number]
        # support for specifying multiple blocks with comma-delimited list
        if block_number.find(",") >= 0:
            blocks = block_number.split(",")

        error = None
        try:
            for block in blocks:
                result = await run_attester_on_block(int(block), options, provider, chain_id)
                results.extend(result)
        except Exception as e:
            error = e

        return results, error

    return run_attester_block
