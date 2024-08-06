from typing import Callable, Tuple
from web3 import AsyncWeb3
from ..cache import Cache
from ..utils import assert_exists, Logger, WithRetry, format_exception
from ..logs import Log
from .parse_debug_traces_and_logs import ParseDebugTracesAndLogs
from .trace import Trace

GetDebugTraceBlock = Callable[[int, str | int,
                               AsyncWeb3], Tuple[list[Trace], list[Log]]]


def provide_get_debug_trace_block(
    parse_debug_traces_and_logs: ParseDebugTracesAndLogs,
    tracer_config: dict,
    logger: Logger,
    cache: Cache,
    with_retry: WithRetry
) -> GetDebugTraceBlock:
    assert_exists(parse_debug_traces_and_logs, 'parse_debug_traces_and_logs')
    assert_exists(logger, 'logger')
    assert_exists(cache, 'cache')
    assert_exists(with_retry, 'with_retry')

    async def get_debug_trace_block(chain_id: int, block_number: int, provider: AsyncWeb3) -> list[Tuple[list[Trace], list[Log]]]:
        # check cache first
        # cached_trace_data = await cache.get_debug_trace_block(chain_id, block_number)
        # if cached_trace_data:
        #     return [Trace(t) for t in cached_trace_data]

        try:
            response = await with_retry(provider.provider.make_request, "debug_traceBlockByNumber", [hex(block_number), tracer_config])
            tx_traces = response['result']
            results = []
            for tx_trace in tx_traces:
                traces, logs = parse_debug_traces_and_logs(
                    tx_trace['result'])
                results.append((traces, logs))

            # write to cache
            # await cache.set_debug_trace_block(chain_id, block_number, [trace.to_json() for trace in traces])

            return results
        except Exception as e:
            logger.error(
                f'error getting debug_traceBlockByNumber: {format_exception(e)}')
        return []

    return get_debug_trace_block
