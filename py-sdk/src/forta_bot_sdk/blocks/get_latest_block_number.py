from typing import Callable
from web3 import AsyncWeb3
from ..cache import Cache
from ..utils import WithRetry, Logger, assert_exists

GetLatestBlockNumber = Callable[[int, AsyncWeb3], int]


def provide_get_latest_block_number(
        cache: Cache,
        with_retry: WithRetry,
        logger: Logger):
    assert_exists(cache, "cache")
    assert_exists(with_retry, "with_retry")
    assert_exists(logger, "logger")

    async def get_latest_block_number(chain_id: int, provider: AsyncWeb3) -> int:
        # check cache first
        logger.debug(
            f'checking cache for eth_blockNumber for chain {chain_id}')
        cached_block_number_hex = await cache.get_latest_block_number(chain_id)
        if cached_block_number_hex:
            logger.debug(
                f'chain {chain_id} latest cached eth_blockNumber: {int(cached_block_number_hex, 0)}')
            return int(cached_block_number_hex, 0)

        logger.debug(
            f'falling back to bots provider for eth_blockNumber for chain {chain_id}')
        response = await with_retry(provider.provider.make_request, "eth_blockNumber", [])
        block_number = int(response['result'], 0)
        return block_number

    return get_latest_block_number
