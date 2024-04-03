from dependency_injector import containers, providers
from .get_trace_data import provide_get_trace_data


class TracesContainer(containers.DeclarativeContainer):
    common = providers.DependenciesContainer()
    cache = providers.DependenciesContainer()

    get_trace_data = providers.Callable(
        provide_get_trace_data, logger=common.logger, cache=cache.cache, with_retry=common.with_retry)
