from typing import Callable
from web3 import AsyncWeb3
from ..cache import Cache
from ..utils import assert_exists, Logger, WithRetry, format_exception
from .trace import Trace

GetTraceData = Callable[[int, str | int,
                         AsyncWeb3], list[Trace]]


def provide_get_trace_data(logger: Logger, cache: Cache, with_retry: WithRetry):
    assert_exists(logger, 'logger')
    assert_exists(cache, 'cache')
    assert_exists(with_retry, 'with_retry')

    async def get_trace_data(chain_id: int, block_number_or_tx_hash: str | int, provider: AsyncWeb3) -> list[Trace]:
        # check cache first
        cached_trace_data = await cache.get_trace_data(chain_id, block_number_or_tx_hash)
        if cached_trace_data:
            return [Trace(t) for t in cached_trace_data]

        # fetch trace data
        try:
            is_block_number = isinstance(block_number_or_tx_hash, int)
            method_name = "trace_block" if is_block_number else "trace_transaction"
            params = [hex(block_number_or_tx_hash)] if is_block_number else [
                block_number_or_tx_hash]
            response = await with_retry(provider.provider.make_request, method_name, params)

            traces = [Trace(t) for t in response['result']]
            # write to cache
            await cache.set_trace_data(chain_id, block_number_or_tx_hash, [trace.to_json() for trace in traces])

            return traces
        except Exception as e:
            logger.error(
                f'error getting trace data: {format_exception(e)}')
        return []

    return get_trace_data
