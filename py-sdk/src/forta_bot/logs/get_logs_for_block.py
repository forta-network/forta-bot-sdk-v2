import json
from typing import Callable
from web3 import AsyncWeb3
from ..utils import Cache, assert_exists

GetLogsForBlock = Callable[[int, AsyncWeb3, int], list[dict]]


def provide_get_logs_for_block(cache: Cache) -> GetLogsForBlock:
    assert_exists(cache, 'cache')

    async def get_logs_for_block(block_number: int, provider: AsyncWeb3, chain_id: int) -> list[dict]:
        # check cache first
        cached_logs = cache.get(get_cache_key(chain_id, block_number))
        if cached_logs:
            return json.loads(cached_logs)

        block_number_hex = hex(block_number)
        logs = await provider.eth.get_logs({'fromBlock': block_number_hex, 'toBlock': block_number_hex})

        # write to cache
        logs_json = provider.to_json(logs)
        cache.set(get_cache_key(chain_id, block_number), logs_json)

        return json.loads(logs_json)

    return get_logs_for_block


def get_cache_key(chain_id: int, block_number: int) -> str:
    return f'{chain_id}-{block_number}-logs'
