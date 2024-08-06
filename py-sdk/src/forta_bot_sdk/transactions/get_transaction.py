from typing import Callable
from web3 import AsyncWeb3
from ..cache import Cache
from ..utils import assert_exists, WithRetry
from ..transactions import Transaction

GetTransaction = Callable[[int, str, AsyncWeb3], Transaction]


def provide_get_transaction(cache: Cache, with_retry: WithRetry) -> GetTransaction:
    assert_exists(cache, 'cache')
    assert_exists(with_retry, 'with_retry')

    async def get_transaction(chain_id: int, tx_hash: str, provider: AsyncWeb3) -> Transaction:
        # check cache first
        # cached_tx = await cache.get_transaction(chain_id, tx_hash)
        # if cached_tx:
        #     return Transaction(cached_tx)

        # fetch the transaction
        response = await with_retry(provider.provider.make_request, "eth_getTransactionByHash", [tx_hash])

        # if no tx found for hash
        if not (response and 'result' in response):
            return None

        transaction = Transaction(response['result'])
        # write to cache
        # await cache.set_transaction(chain_id, tx_hash, transaction.to_json())

        return transaction

    return get_transaction
