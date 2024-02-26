
from typing import Any, Callable
from .assertions import assert_exists
from .sleep import Sleep

WithRetry = Callable[[Callable], Any]

MAX_RETRIES = 3


def provide_with_retry(sleep: Sleep):
    assert_exists(sleep, 'sleep')

    async def with_retry(fn: Callable, *args, attempt_number=1):
        try:
            result = await fn(*args)
            # TODO this error check is web3.py specific, ideally should be generalized
            if 'error' in result:
                raise Exception(result['error'])
            return result
        except Exception as e:
            if attempt_number >= MAX_RETRIES:
                raise e
            await sleep(1*attempt_number)  # wait a bit before trying again
            return await with_retry(fn, *args, attempt_number=attempt_number+1)

    return with_retry
