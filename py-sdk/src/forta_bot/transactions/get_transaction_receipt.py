from typing import Callable
from web3 import AsyncWeb3
from ..cache import Cache
from ..utils import assert_exists, WithRetry
from ..transactions import Receipt

GetTransactionReceipt = Callable[[int, str, AsyncWeb3], Receipt]


def provide_get_transaction_receipt(cache: Cache, with_retry: WithRetry) -> GetTransactionReceipt:
    assert_exists(cache, 'cache')
    assert_exists(with_retry, 'with_retry')

    async def get_transaction_receipt(chain_id: int, tx_hash: str, provider: AsyncWeb3) -> Receipt:
        # check cache first
        cached_receipt = await cache.get_transaction_receipt(chain_id, tx_hash)
        if cached_receipt:
            return Receipt(cached_receipt)

        # fetch the receipt
        response = await with_retry(provider.provider.make_request, "eth_getTransactionReceipt", [tx_hash])

        # if no tx found for hash
        if not (response and 'result' in response):
            return None

        receipt = Receipt(response['result'])
        # write to cache
        await cache.set_transaction_receipt(chain_id, tx_hash, receipt.to_json())

        return receipt

    return get_transaction_receipt
