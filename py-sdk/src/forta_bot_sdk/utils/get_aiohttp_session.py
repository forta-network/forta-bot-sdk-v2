from typing import Callable
import aiohttp
from aiohttp import ClientTimeout
from .logger import Logger
from .assertions import assert_exists

GetAioHttpSession = Callable[[], aiohttp.ClientSession]


AIOHTTP_SESSION = None  # maintain a single reference to the session


def provide_get_aiohttp_session(logger: Logger):
    assert_exists(logger, 'logger')

    async def get_aiohttp_session():
        global AIOHTTP_SESSION
        if AIOHTTP_SESSION:
            return AIOHTTP_SESSION

        AIOHTTP_SESSION = aiohttp.ClientSession(
            timeout=ClientTimeout(total=10))
        return AIOHTTP_SESSION

    return get_aiohttp_session
