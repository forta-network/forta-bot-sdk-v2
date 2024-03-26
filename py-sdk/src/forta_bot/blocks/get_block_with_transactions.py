import json
from web3 import AsyncWeb3
from typing import Callable
from ..cache import Cache
from ..utils import assert_exists


GetBlockWithTransactions = Callable[[int, str | int, AsyncWeb3], dict]


def provide_get_block_with_transactions(cache: Cache) -> GetBlockWithTransactions:
    assert_exists(cache, 'cache')

    async def get_block_with_transactions(chain_id: int, block_hash_or_number: str | int, provider: AsyncWeb3) -> dict:
        # check cache first
        cached_block = await cache.get_block_with_transactions(chain_id, block_hash_or_number)
        if cached_block:
            return cached_block

        # fetch the block with transactions
        block = await provider.eth.get_block(block_hash_or_number, True)

        # write to cache
        block_json: dict = json.loads(provider.to_json(block))
        await cache.set_block_with_transactions(chain_id, block_json)

        return block_json

    return get_block_with_transactions
