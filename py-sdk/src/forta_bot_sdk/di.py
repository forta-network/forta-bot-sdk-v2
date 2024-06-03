import os
from os import path
from dependency_injector import containers, providers
from .jwt import JwtContainer
from .utils import FileSystem, Logger, provide_get_forta_config, provide_get_json_file, provide_get_bot_id, provide_get_forta_api_url, provide_get_forta_api_headers, provide_sleep, provide_get_aiohttp_session, provide_get_forta_chain_id, provide_get_bot_owner, provide_get_chain_id, provide_with_retry
from .scanning import ScanningContainer
from .cli import CliContainer
from .alerts import AlertsContainer
from .labels import LabelsContainer
from .blocks import BlocksContainer
from .transactions import TransactionsContainer
from .handlers import HandlersContainer
from .traces import TracesContainer
from .logs import LogsContainer
from .health import HealthContainer
from .metrics import MetricsContainer
from .attester import AttesterContainer
from .cache import CacheContainer


class CommonContainer(containers.DeclarativeContainer):
    forta_global_root = providers.Object(
        path.join(path.expanduser('~'), '.forta'))
    is_prod = providers.Object(True if os.environ.get(
        'FORTA_ENV') == 'production' or os.environ.get('NODE_ENV') == 'production' else False)
    is_debug = providers.Object(True if os.environ.get(
        'FORTA_DEBUG') == 'true' else False)
    is_running_cli_command = providers.Object(
        True if 'FORTA_CLI' in os.environ else False)
    config_filename = providers.Object('forta.config.json')
    local_config_filename = providers.Object(
        os.environ['FORTA_CONFIG'] if 'FORTA_CONFIG' in os.environ else config_filename())
    context_path = providers.Object(
        os.environ['FORTA_CONTEXT_PATH'] if 'FORTA_CONTEXT_PATH' in os.environ else os.getcwd())
    args = providers.Object({})  # TODO
    logger = providers.Singleton(Logger, is_prod=is_prod, is_debug=is_debug)
    get_aiohttp_session = providers.Callable(
        provide_get_aiohttp_session, logger=logger)
    file_system = providers.Factory[FileSystem](FileSystem)
    get_json_file = providers.Callable(provide_get_json_file)
    sleep = providers.Callable(provide_sleep)
    with_retry = providers.Callable(
        provide_with_retry, sleep=sleep, logger=logger)
    get_forta_config = providers.Callable(provide_get_forta_config,
                                          file_system=file_system,
                                          is_prod=is_prod,
                                          config_filename=config_filename,
                                          local_config_filename=local_config_filename,
                                          forta_global_root=forta_global_root,
                                          get_json_file=get_json_file,
                                          context_path=context_path)
    forta_config = providers.Object(get_forta_config()())
    forta_chain_id = providers.Object[int](
        int(os.environ['FORTA_CHAIN_ID']) if 'FORTA_CHAIN_ID' in os.environ else None)
    forta_bot_owner = providers.Object(os.environ.get('FORTA_BOT_OWNER'))
    forta_shard_id = providers.Object(
        int(os.environ['FORTA_SHARD_ID']) if 'FORTA_SHARD_ID' in os.environ else None)
    forta_shard_count = providers.Object(int(
        os.environ['FORTA_SHARD_COUNT']) if 'FORTA_SHARD_COUNT' in os.environ else None)

    get_bot_id = providers.Callable(
        provide_get_bot_id, args=args, forta_config=forta_config)
    get_forta_chain_id = providers.Callable(
        provide_get_forta_chain_id, forta_chain_id=forta_chain_id)
    get_bot_owner = providers.Callable(
        provide_get_bot_owner, forta_bot_owner=forta_bot_owner)
    get_forta_api_url = providers.Callable(
        provide_get_forta_api_url, forta_config=forta_config)
    get_forta_api_headers = providers.Callable(
        provide_get_forta_api_headers, forta_config=forta_config)
    get_chain_id = providers.Callable(
        provide_get_chain_id, with_retry=with_retry)


class RootContainer(containers.DeclarativeContainer):
    common = providers.Container(CommonContainer)
    metrics = providers.Container(MetricsContainer)
    cache = providers.Container(CacheContainer, common=common, metrics=metrics)
    transactions = providers.Container(
        TransactionsContainer, common=common, cache=cache)
    traces = providers.Container(TracesContainer, common=common, cache=cache)
    logs = providers.Container(LogsContainer, common=common, cache=cache)
    blocks = providers.Container(
        BlocksContainer, common=common, traces=traces, logs=logs, transactions=transactions, cache=cache)
    jwt = providers.Container(JwtContainer, common=common)
    alerts = providers.Container(AlertsContainer, common=common, cache=cache)
    labels = providers.Container(LabelsContainer, common=common)
    handlers = providers.Container(HandlersContainer, common=common, blocks=blocks, transactions=transactions,
                                   alerts=alerts, traces=traces, logs=logs, metrics=metrics)
    cli = providers.Container(
        CliContainer, common=common, transactions=transactions, handlers=handlers, cache=cache)
    attester = providers.Container(
        AttesterContainer, common=common, transactions=transactions)
    scanning = providers.Container(ScanningContainer, common=common, jwt=jwt, cli=cli, alerts=alerts,
                                   blocks=blocks, transactions=transactions, handlers=handlers, metrics=metrics)
    health = providers.Container(
        HealthContainer, common=common, metrics=metrics)
