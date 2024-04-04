from dependency_injector import containers, providers
from .create_block_event import provide_create_block_event
from .get_latest_block_number import provide_get_latest_block_number
from .get_block_with_transactions import provide_get_block_with_transactions


class BlocksContainer(containers.DeclarativeContainer):
    common = providers.DependenciesContainer()
    traces = providers.DependenciesContainer()
    logs = providers.DependenciesContainer()
    transactions = providers.DependenciesContainer()
    cache = providers.DependenciesContainer()

    create_block_event = providers.Callable(provide_create_block_event)
    get_latest_block_number = providers.Callable(
        provide_get_latest_block_number, cache=cache.cache, with_retry=common.with_retry, logger=common.logger)
    get_block_with_transactions = providers.Callable(
        provide_get_block_with_transactions, cache=cache.cache, with_retry=common.with_retry)
