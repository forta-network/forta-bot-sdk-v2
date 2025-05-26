

from typing import Callable, Optional, Tuple
from web3 import AsyncWeb3
from .run_attester_block_range import RunAttesterBlockRange, AttestTransactionResult
from ..utils import assert_exists, Sleep
from ..common import RunAttesterOptions
from ..blocks import GetLatestBlockNumber


RunAttesterLive = Callable[[RunAttesterOptions, AsyncWeb3, int],
                           Tuple[list[Tuple[str, AttestTransactionResult]], list[Tuple[str, Exception]]]]


def provide_run_attester_live(
    get_latest_block_number: GetLatestBlockNumber,
    run_attester_block_range: RunAttesterBlockRange,
    sleep: Sleep
):
    assert_exists(get_latest_block_number, "get_latest_block_number")
    assert_exists(run_attester_block_range, "run_attester_block_range")
    assert_exists(sleep, "sleep")

    async def run_live(options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int, results=[], errors=[]) -> None:
        current_block_number: Optional[int] = None
        polling_interval_seconds = 12 if chain_id == 1 else 3

        print(f'listening for data on chain {chain_id}...')
        while (True):
            latest_block_number = await get_latest_block_number(chain_id, provider)
            if current_block_number is None:
                current_block_number = latest_block_number-1

            # if no new blocks
            if (current_block_number >= latest_block_number):
                # wait for a bit
                await sleep(polling_interval_seconds)
            else:
                # process new blocks
                block_range = f'{current_block_number}..{latest_block_number}'
                await run_attester_block_range(block_range, options, provider, chain_id, results, errors)
                current_block_number = latest_block_number+1

    return run_live
