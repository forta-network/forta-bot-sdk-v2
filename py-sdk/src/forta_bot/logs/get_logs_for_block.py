import json
from typing import Callable
from web3 import AsyncWeb3
from ..cache import Cache
from ..utils import assert_exists

GetLogsForBlock = Callable[[int, int, AsyncWeb3], list[dict]]


def provide_get_logs_for_block(cache: Cache) -> GetLogsForBlock:
    assert_exists(cache, 'cache')

    async def get_logs_for_block(chain_id: int, block_number: int, provider: AsyncWeb3) -> list[dict]:
        # check cache first
        cached_logs = await cache.get_logs_for_block(chain_id, block_number)
        if cached_logs:
            return cached_logs

        block_number_hex = hex(block_number)
        logs = await provider.eth.get_logs({'fromBlock': block_number_hex, 'toBlock': block_number_hex})

        # write to cache
        logs_json: list[dict] = json.loads(provider.to_json(logs))
        await cache.set_logs_for_block(chain_id, block_number, logs_json)

        return logs_json

    return get_logs_for_block
