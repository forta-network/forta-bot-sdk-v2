import json
from typing import Callable
from web3 import AsyncWeb3
from ..utils import assert_exists, Logger, Cache

GetTraceData = Callable[[str | int,
                         AsyncWeb3, int], list[dict]]


def provide_get_trace_data(logger: Logger, cache: Cache):
    assert_exists(logger, 'logger')
    assert_exists(cache, 'cache')

    async def get_trace_data(block_number_or_tx_hash: str | int, provider: AsyncWeb3, chain_id: int) -> list[dict]:
        # check cache first
        cached_trace_data = cache.get(
            get_cache_key(chain_id, block_number_or_tx_hash))
        if cached_trace_data:
            return json.loads(cached_trace_data)

        # fetch trace data
        try:
            is_block_number = isinstance(block_number_or_tx_hash, int)
            if is_block_number:
                trace_data = await provider.tracing.trace_block(hex(block_number_or_tx_hash))
            else:
                trace_data = await provider.tracing.trace_transaction(block_number_or_tx_hash)

            # write to cache
            trace_data_json = provider.to_json(trace_data)
            cache.set(get_cache_key(
                chain_id, block_number_or_tx_hash), trace_data_json)

            return json.loads(trace_data_json)
        except Exception as e:
            logger.error(f'error getting trace data: {e}')

        return []

    return get_trace_data


def get_cache_key(chain_id: int, block_number_or_tx_hash: int | str) -> str:
    return f'{chain_id}-{str(block_number_or_tx_hash).lower()}-trace'
