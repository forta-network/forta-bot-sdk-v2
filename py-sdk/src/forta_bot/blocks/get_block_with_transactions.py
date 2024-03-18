import json
from web3 import AsyncWeb3
from typing import Callable
from ..utils import Cache, assert_exists


GetBlockWithTransactions = Callable[[str | int, AsyncWeb3, int], dict]


def provide_get_block_with_transactions(cache: Cache) -> GetBlockWithTransactions:
    assert_exists(cache, 'cache')

    async def get_block_with_transactions(block_hash_or_number: str | int, provider: AsyncWeb3, chain_id: int) -> dict:
        # check cache first
        cached_block = cache.get(get_cache_key(chain_id, block_hash_or_number))
        if cached_block:
            return json.loads(cached_block)

        # fetch the block with transactions
        block = await provider.eth.get_block(block_hash_or_number, True)

        # write to cache
        block_json = provider.to_json(block)
        cache.set(get_cache_key(chain_id, block.hash), block_json)
        cache.set(get_cache_key(chain_id, block.number), block_json)

        return json.loads(block_json)

    return get_block_with_transactions


def get_cache_key(chain_id: int, block_hash_or_number: str | int) -> str:
    return f'{chain_id}-{str(block_hash_or_number).lower()}'
