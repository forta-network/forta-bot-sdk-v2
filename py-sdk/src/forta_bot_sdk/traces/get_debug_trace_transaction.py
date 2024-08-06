from typing import Callable, Tuple
from web3 import AsyncWeb3
from ..cache import Cache
from ..utils import assert_exists, Logger, WithRetry, format_exception
from ..logs import Log
from .parse_debug_traces_and_logs import ParseDebugTracesAndLogs
from .trace import Trace

GetDebugTraceTransaction = Callable[[int, str | int,
                                     AsyncWeb3], Tuple[list[Trace], list[Log]]]


def provide_get_debug_trace_transaction(
    parse_debug_traces_and_logs: ParseDebugTracesAndLogs,
    tracer_config: dict,
    logger: Logger,
    cache: Cache,
    with_retry: WithRetry
) -> GetDebugTraceTransaction:
    assert_exists(parse_debug_traces_and_logs, 'parse_debug_traces_and_logs')
    assert_exists(logger, 'logger')
    assert_exists(cache, 'cache')
    assert_exists(with_retry, 'with_retry')

    async def get_debug_trace_transaction(chain_id: int, tx_hash: str, provider: AsyncWeb3) -> Tuple[list[Trace], list[Log]]:
        # check cache first
        # cached_trace_data = await cache.get_debug_trace_transaction(chain_id, block_number_or_tx_hash)
        # if cached_trace_data:
        #     return [Trace(t) for t in cached_trace_data]

        # fetch debug_traceTransaction
        try:
            response = await with_retry(provider.provider.make_request, "debug_traceTransaction", [tx_hash, tracer_config])

            traces, logs = parse_debug_traces_and_logs(response['result'])

            # write to cache
            # await cache.set_debug_trace_transaction(chain_id, block_number_or_tx_hash, [trace.to_json() for trace in traces])

            return traces, logs
        except Exception as e:
            logger.error(
                f'error getting debug_traceTransaction: {format_exception(e)}')
        return []

    return get_debug_trace_transaction
