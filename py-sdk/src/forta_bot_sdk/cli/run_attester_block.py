from typing import Callable
from web3 import AsyncWeb3
from ..utils import assert_exists
from ..common import RunAttesterOptions
from ..handlers import RunAttesterOnBlock
from ..utils import now
from .write_attestations_to_file import WriteAttestationsToFile

RunAttesterBlock = Callable[[str, RunAttesterOptions, AsyncWeb3, int], None]


def provide_run_attester_block(
        run_attester_on_block: RunAttesterOnBlock,
        write_attestations_to_file: WriteAttestationsToFile
) -> RunAttesterBlock:
    assert_exists(run_attester_on_block, 'run_attester_on_block')

    async def run_attester_block(block_number: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int) -> None:
        blocks = [block_number]
        # support for specifying multiple blocks with comma-delimited list
        if block_number.find(",") >= 0:
            blocks = block_number.split(",")

        results = []
        for block in blocks:
            result = await run_attester_on_block(int(block), options, provider, chain_id)
            results.extend(result)

        write_attestations_to_file(options, results)

    return run_attester_block
