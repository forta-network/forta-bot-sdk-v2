from typing import Callable, Optional, Tuple
from web3 import AsyncWeb3
from ..common import RunAttesterOptions, AttestTransactionResult
from ..handlers import RunAttesterOnBlock

RunAttesterBlockRange = Callable[[
    str, RunAttesterOptions, AsyncWeb3, int], Tuple[list[Tuple[str, AttestTransactionResult]], Optional[Exception]]]


def provide_run_attester_block_range(
    run_attester_on_block: RunAttesterOnBlock,
):
    async def run_block_range(block_range: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int) -> None:
        start_block, end_block = block_range.split("..")
        start_block_number = int(start_block)
        end_block_number = int(end_block)
        if end_block_number <= start_block_number:
            raise Exception("end block must be greater than start block")

        results = []
        error = None
        try:
            for block_number in range(start_block_number, end_block_number+1):
                result = await run_attester_on_block(block_number, options, provider, chain_id)
                results.extend(result)
        except Exception as e:
            error = e

        return results, error

    return run_block_range
