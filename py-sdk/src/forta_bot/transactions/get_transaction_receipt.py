import json
from typing import Callable
from web3 import AsyncWeb3
from ..utils import Cache, assert_exists

GetTransactionReceipt = Callable[[str, AsyncWeb3, int], dict]


def provide_get_transaction_receipt(cache: Cache):
    assert_exists(cache, 'cache')

    async def get_transaction_receipt(tx_hash: str, provider: AsyncWeb3, chain_id: int):
        # check cache first
        cached_receipt = cache.get(get_cache_key(chain_id, tx_hash))
        if cached_receipt:
            return json.loads(cached_receipt)

        # fetch the receipt
        receipt = await provider.eth.get_transaction_receipt(tx_hash)

        # write to cache
        receipt_json = provider.to_json(receipt)
        cache.set(get_cache_key(chain_id, tx_hash), receipt_json)

        return json.loads(receipt_json)

    return get_transaction_receipt


def get_cache_key(chain_id: int, tx_hash: str) -> str:
    return f'{chain_id}-{tx_hash.lower()}'
