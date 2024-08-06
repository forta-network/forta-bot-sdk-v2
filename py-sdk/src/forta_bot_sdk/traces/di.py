from dependency_injector import containers, providers
from .get_trace_data import provide_get_trace_data
from .get_debug_trace_transaction import provide_get_debug_trace_transaction
from .get_debug_trace_block import provide_get_debug_trace_block
from .parse_debug_traces_and_logs import provide_parse_debug_traces_and_logs


class TracesContainer(containers.DeclarativeContainer):
    common = providers.DependenciesContainer()
    cache = providers.DependenciesContainer()

    tracer_config = providers.Object({
        "tracer": "callTracer",
        "tracerConfig": {
            "withLog": True
        }
    })
    parse_debug_traces_and_logs = providers.Callable(
        provide_parse_debug_traces_and_logs)
    get_trace_data = providers.Callable(
        provide_get_trace_data, logger=common.logger, cache=cache.cache, with_retry=common.with_retry)
    get_debug_trace_transaction = providers.Callable(
        provide_get_debug_trace_transaction, parse_debug_traces_and_logs=parse_debug_traces_and_logs, tracer_config=tracer_config, logger=common.logger, cache=cache.cache, with_retry=common.with_retry)
    get_debug_trace_block = providers.Callable(
        provide_get_debug_trace_block, parse_debug_traces_and_logs=parse_debug_traces_and_logs, tracer_config=tracer_config, logger=common.logger, cache=cache.cache, with_retry=common.with_retry)
