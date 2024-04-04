import os
import pickledb
from dependency_injector import containers, providers
from .get_json_rpc_cache_provider import provide_get_json_rpc_cache_provider
from .is_cache_healthy import provide_is_cache_healthy
from .disk_cache import DiskCache
from .json_rpc_cache import JsonRpcCache


class CacheContainer(containers.DeclarativeContainer):
    common = providers.DependenciesContainer()
    metrics = providers.DependenciesContainer()

    def provide_cache(is_prod: bool, disk_cache: DiskCache, json_rpc_cache: JsonRpcCache):
        return json_rpc_cache if is_prod else disk_cache

    def provide_json_rpc_cache_url():
        host = os.environ.get(
            'JSON_RPC_CACHE_HOST') or os.environ.get('JSON_RPC_HOST')
        port = os.environ.get('JSON_RPC_CACHE_PORT')
        return f'http://{host}:{port}'

    def provide_json_rpc_cache_retry_options():
        return {
            'timeout_seconds': int(os.environ.get('JSON_RPC_CACHE_TIMEOUT')) if 'JSON_RPC_CACHE_TIMEOUT' in os.environ else 20,
            'backoff_seconds': int(os.environ.get('JSON_RPC_CACHE_INTERVAL')) if 'JSON_RPC_CACHE_INTERVAL' in os.environ else 1
        }

    json_rpc_cache_retry_options = providers.Callable(
        provide_json_rpc_cache_retry_options)
    json_rpc_cache_url = providers.Callable(provide_json_rpc_cache_url)
    get_json_rpc_cache_provider = providers.Callable(
        provide_get_json_rpc_cache_provider,
        json_rpc_cache_url=json_rpc_cache_url,
        json_rpc_cache_retry_options=json_rpc_cache_retry_options)
    is_cache_healthy = providers.Callable(
        provide_is_cache_healthy,
        json_rpc_cache_url=json_rpc_cache_url,
        get_aiohttp_session=common.get_aiohttp_session)
    disk_cache = providers.Singleton(
        DiskCache,
        pickledb_load=pickledb.load,
        folder_path=common.forta_global_root)
    json_rpc_cache = providers.Singleton(
        JsonRpcCache,
        get_json_rpc_cache_provider=get_json_rpc_cache_provider,
        json_rpc_cache_retry_options=json_rpc_cache_retry_options,
        is_cache_healthy=is_cache_healthy,
        metrics_helper=metrics.metrics_helper,
        with_retry=common.with_retry,
        logger=common.logger)
    cache = providers.Callable(provide_cache,
                               is_prod=common.is_prod,
                               disk_cache=disk_cache,
                               json_rpc_cache=json_rpc_cache)
