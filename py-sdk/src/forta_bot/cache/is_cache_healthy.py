from typing import Callable, TypedDict
from datetime import datetime

from aiohttp import ClientSession
from ..utils import GetAioHttpSession, assert_is_non_empty_string, assert_exists, now


IsCacheHealthy = Callable[[int], bool]

ONE_MIN_IN_SECONDS = 60


class HealthStatus(TypedDict):
    is_healthy: bool
    timestamp: int


def provide_is_cache_healthy(json_rpc_cache_url: str, get_aiohttp_session: GetAioHttpSession) -> IsCacheHealthy:
    assert_is_non_empty_string(json_rpc_cache_url, 'json_rpc_cache_url')
    assert_exists(get_aiohttp_session, 'get_aiohttp_session')

    # cache health status responses in-memory
    health_status: dict[int, HealthStatus] = {}

    async def is_cache_healthy(chain_id: int) -> bool:
        nonlocal health_status
        status = health_status.get(chain_id)
        # if we have a previous status for this chain that is not expired, return it
        if status and now() - status['timestamp'] < ONE_MIN_IN_SECONDS:
            return status['is_healthy']

        # query cache for health status
        session: ClientSession = await get_aiohttp_session()
        response = await session.get(f'{json_rpc_cache_url}/health/{chain_id}')
        is_healthy = True if response.status == 200 else False

        health_status[chain_id] = {
            'is_healthy': is_healthy, 'timestamp': now()}
        return is_healthy

    return is_cache_healthy
