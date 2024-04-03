from web3 import AsyncWeb3
from typing import Callable, Optional
from ..cache import Cache
from ..utils import assert_exists, WithRetry
from .block import Block


GetBlockWithTransactions = Callable[[
    int, str | int, AsyncWeb3], Optional[Block]]


def provide_get_block_with_transactions(cache: Cache, with_retry: WithRetry) -> GetBlockWithTransactions:
    assert_exists(cache, 'cache')
    assert_exists(with_retry, 'with_retry')

    async def get_block_with_transactions(chain_id: int, block_hash_or_number: str | int, provider: AsyncWeb3) -> Optional[Block]:
        # check cache first
        cached_block = await cache.get_block_with_transactions(chain_id, block_hash_or_number)
        if cached_block:
            return Block(cached_block)

        # determine which method to use based on input
        method_name = "eth_getBlockByNumber"
        if type(block_hash_or_number) == str:
            if not block_hash_or_number.startswith('0x'):
                block_hash_or_number = int(block_hash_or_number, 0)
            else:
                method_name = "eth_getBlockByHash"

        # fetch the block with full transactions
        response = await with_retry(provider.provider.make_request, method_name, [hex(block_hash_or_number), True])

        # if no valid block found for block hash/number
        if not (response and 'result' in response):
            return None

        block = Block(response['result'])
        # write to cache
        await cache.set_block_with_transactions(chain_id, block.to_json())

        return block

    return get_block_with_transactions
