import json
from typing import Callable
from web3 import AsyncWeb3
from ..cache import Cache
from ..utils import assert_exists

GetTransactionReceipt = Callable[[int, str, AsyncWeb3], dict]


def provide_get_transaction_receipt(cache: Cache) -> GetTransactionReceipt:
    assert_exists(cache, 'cache')

    async def get_transaction_receipt(chain_id: int, tx_hash: str, provider: AsyncWeb3):
        # check cache first
        cached_receipt = await cache.get_transaction_receipt(chain_id, tx_hash)
        if cached_receipt:
            return cached_receipt

        # fetch the receipt
        receipt = await provider.eth.get_transaction_receipt(tx_hash)

        # write to cache
        receipt_json: dict = json.loads(provider.to_json(receipt))
        await cache.set_transaction_receipt(chain_id, tx_hash, receipt_json)

        return receipt_json

    return get_transaction_receipt
