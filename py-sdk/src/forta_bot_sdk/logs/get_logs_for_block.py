from typing import Callable
from web3 import AsyncWeb3
from ..cache import Cache
from ..utils import assert_exists, WithRetry
from .log import Log

GetLogsForBlock = Callable[[int, int, AsyncWeb3], list[Log]]


def provide_get_logs_for_block(cache: Cache, with_retry: WithRetry) -> GetLogsForBlock:
    assert_exists(cache, 'cache')
    assert_exists(with_retry, 'with_retry')

    async def get_logs_for_block(chain_id: int, block_number: int, provider: AsyncWeb3) -> list[Log]:
        # check cache first
        cached_logs = await cache.get_logs_for_block(chain_id, block_number)
        if cached_logs:
            return [Log(l) for l in cached_logs]

        block_number_hex = hex(block_number)
        response = await with_retry(provider.provider.make_request, "eth_getLogs", [{'fromBlock': block_number_hex, 'toBlock': block_number_hex}])

        logs = [Log(l) for l in response['result']]
        # write to cache
        await cache.set_logs_for_block(chain_id, block_number, [log.to_json() for log in logs])

        return logs

    return get_logs_for_block
