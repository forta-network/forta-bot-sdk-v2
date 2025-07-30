import os
from os import path
import pickledb
from dependency_injector import containers, providers
from .get_json_rpc_cache_provider import provide_get_json_rpc_cache_provider
from .is_cache_healthy import provide_is_cache_healthy
from .cache import Cache
from .disk_cache import DiskCache
from .json_rpc_cache import JsonRpcCache


class CacheContainer(containers.DeclarativeContainer):
    common = providers.DependenciesContainer()
    metrics = providers.DependenciesContainer()

    def provide_cache(is_prod: bool, is_cache_disabled: bool, disk_cache: DiskCache, json_rpc_cache: JsonRpcCache, no_op_cache: Cache):
        if is_cache_disabled:
            return no_op_cache
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

    def provide_disk_cache_file_path(default_folder_path: str, custom_disk_cache_file: str):
        if custom_disk_cache_file:
            return path.join(os.getcwd(), custom_disk_cache_file)
        else:
            return path.join(default_folder_path, "forta-bot-cache-py")

    is_cache_disabled = providers.Object("FORTA_CLI_NO_CACHE" in os.environ)
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
    disk_cache_file_path = providers.Callable(provide_disk_cache_file_path,
                                              default_folder_path=common.forta_global_root,
                                              custom_disk_cache_file=common.disk_cache_file)
    disk_cache = providers.Singleton(
        DiskCache,
        pickledb_load=pickledb.load,
        file_path=disk_cache_file_path)
    json_rpc_cache = providers.Singleton(
        JsonRpcCache,
        get_json_rpc_cache_provider=get_json_rpc_cache_provider,
        json_rpc_cache_retry_options=json_rpc_cache_retry_options,
        is_cache_healthy=is_cache_healthy,
        metrics_helper=metrics.metrics_helper,
        with_retry=common.with_retry,
        logger=common.logger)
    no_op_cache = providers.Singleton(Cache)
    cache = providers.Callable(provide_cache,
                               is_prod=common.is_prod,
                               is_cache_disabled=is_cache_disabled,
                               disk_cache=disk_cache,
                               json_rpc_cache=json_rpc_cache,
                               no_op_cache=no_op_cache)
