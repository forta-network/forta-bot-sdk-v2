from typing import Callable
from web3 import AsyncWeb3
from web3.middleware import async_geth_poa_middleware
from ..utils import assert_exists, assert_is_non_empty_string, RetryOptions


GetJsonRpcCacheProvider = Callable[[int], AsyncWeb3]


def provide_get_json_rpc_cache_provider(json_rpc_cache_url: str, json_rpc_cache_retry_options: RetryOptions) -> GetJsonRpcCacheProvider:
    assert_is_non_empty_string(json_rpc_cache_url, 'json_rpc_cache_url')
    assert_exists(json_rpc_cache_retry_options, 'json_rpc_cache_retry_options')

    # maintain reference to created providers
    providers: dict[int, AsyncWeb3] = {}

    def get_json_rpc_cache_provider(chain_id: int) -> AsyncWeb3:
        nonlocal providers
        # check if we've already created a provider for this chain
        if chain_id in providers:
            return providers[chain_id]

        # create a new provider for the chain
        provider = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(
            json_rpc_cache_url,
            request_kwargs={
                'headers': {
                    'X-Forta-Chain-ID': str(chain_id)
                },
                'timeout': json_rpc_cache_retry_options['timeout_seconds']
            }))
        providers[chain_id] = provider
        return provider

    return get_json_rpc_cache_provider
