from typing import Callable
from datetime import datetime
from web3 import AsyncWeb3
from web3.middleware import async_geth_poa_middleware
from ..utils import FortaConfig, assert_exists, GetChainId, ONE_MIN_IN_SECONDS
from ..jwt import GetRpcJwt, DecodeJwt
from ..common import ScanEvmOptions
from ..metrics import MetricsHelper


GetProvider = Callable[[ScanEvmOptions], AsyncWeb3]


def provide_get_provider(
    get_rpc_jwt: GetRpcJwt,
    decode_jwt: DecodeJwt,
    get_chain_id: GetChainId,
    forta_config: FortaConfig,
    metrics_helper: MetricsHelper,
    is_prod: bool
) -> GetProvider:
    assert_exists(get_rpc_jwt, 'get_rpc_jwt')
    assert_exists(decode_jwt, 'decode_jwt')
    assert_exists(get_chain_id, 'get_chain_id')
    assert_exists(forta_config, 'forta_config')
    assert_exists(metrics_helper, 'metrics_helper')

    # maintain references to created providers (keyed by rpc url)
    providers: dict[str, AsyncWeb3] = {}
    # if using rpc_key_id, keep track of when the issued jwt expires so we can refresh (keyed by rpc url)
    rpc_jwt_expirations: dict[str, datetime] = {}

    async def get_provider(options: ScanEvmOptions) -> AsyncWeb3:
        nonlocal providers
        nonlocal rpc_jwt_expirations

        rpc_url = options.get('rpc_url')
        rpc_key_id = options.get('rpc_key_id')
        rpc_headers = options.get('rpc_headers')
        rpc_jwt_claims = options.get('rpc_jwt_claims')
        local_rpc_url = options.get('local_rpc_url')
        local_rpc_urls = forta_config.get('localRpcUrls', {})
        headers = {}

        # if there is a locally configured rpc url, use that when not running in production
        if not is_prod and local_rpc_url and local_rpc_url in local_rpc_urls:
            rpc_url = local_rpc_urls[local_rpc_url]

        # make sure some rpc url is provided
        if rpc_url is None:
            raise Exception("no rpc_url provided")

        # check if we have a cached provider
        if providers.get(rpc_url) is not None and not is_jwt_expired(rpc_jwt_expirations.get(rpc_url)):
            return providers.get(rpc_url)

        # do jwt token exchange if rpc_key_id provided (only in production)
        if is_prod and rpc_key_id is not None:
            rpc_jwt = await get_rpc_jwt(rpc_url, rpc_key_id, rpc_jwt_claims)
            headers["Authorization"] = f'Bearer {rpc_jwt}'
            rpc_jwt_expirations[rpc_url] = datetime.fromtimestamp(
                decode_jwt(rpc_jwt)['payload']['exp'])

        # set any custom headers
        if rpc_headers is not None:
            headers = {**headers, **rpc_headers}

        provider = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(
            rpc_url, request_kwargs={'headers': headers}))
        providers[rpc_url] = provider
        chain_id = await get_chain_id(provider)
        # add a middleware to the provider to track metrics for json-rpc calls

        async def metrics_middleware(make_request, w3):
            async def middleware(method_name, params):
                request_id = metrics_helper.start_json_rpc_timer(
                    chain_id, method_name)
                try:
                    response = await make_request(method_name, params)
                    metrics_helper.report_json_rpc_success(
                        request_id, chain_id, method_name)
                except Exception as e:
                    if '429' in str(e):
                        metrics_helper.report_json_rpc_throttled(
                            request_id, chain_id, method_name)
                    else:
                        metrics_helper.report_json_rpc_error(
                            request_id, chain_id, method_name)
                    raise e
                return response
            return middleware
        provider.middleware_onion.add(metrics_middleware)
        # geth_poa_middleware is needed to support chains like Polygon and BSC
        # see https://web3py.readthedocs.io/en/stable/middleware.html#proof-of-authority
        provider.middleware_onion.inject(async_geth_poa_middleware, layer=0)
        return provider

    return get_provider


def is_jwt_expired(rpc_jwt_expiration: datetime) -> bool:
    if rpc_jwt_expiration is None:
        return False

    return rpc_jwt_expiration.timestamp() + ONE_MIN_IN_SECONDS >= datetime.now().timestamp()
