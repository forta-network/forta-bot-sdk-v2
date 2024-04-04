from dependency_injector import containers, providers
from .get_logs_for_block import provide_get_logs_for_block
from .filter_logs import provide_filter_logs


class LogsContainer(containers.DeclarativeContainer):
    common = providers.DependenciesContainer()
    cache = providers.DependenciesContainer()

    get_logs_for_block = providers.Callable(
        provide_get_logs_for_block, cache=cache.cache, with_retry=common.with_retry)
    filter_logs = providers.Callable(provide_filter_logs)
