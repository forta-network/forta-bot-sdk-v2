from typing import Callable
from web3 import AsyncWeb3
from .with_retry import WithRetry
from .assertions import assert_exists

# returns the chain id from the "eth_chainId" json-rpc method
GetChainId = Callable[[AsyncWeb3], int]


def provide_get_chain_id(with_retry: WithRetry) -> GetChainId:
    assert_exists(with_retry, "with_retry")

    async def get_chain_id(provider: AsyncWeb3) -> int:
        response = await with_retry(provider.provider.make_request, "eth_chainId", [])
        chain_id = int(response['result'], 0)
        return chain_id

    return get_chain_id
