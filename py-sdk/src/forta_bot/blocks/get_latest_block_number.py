from typing import Callable
from web3 import AsyncWeb3
from ..utils import WithRetry, assert_exists

GetLatestBlockNumber = Callable[[AsyncWeb3], int]


def provide_get_latest_block_number(
        with_retry: WithRetry
):
    assert_exists(with_retry, "with_retry")

    async def get_latest_block_number(provider: AsyncWeb3) -> int:
        response = await with_retry(provider.provider.make_request, "eth_blockNumber", [])
        block_number = int(response['result'], 0)
        return block_number

    return get_latest_block_number
