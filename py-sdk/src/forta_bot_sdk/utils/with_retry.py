from typing import Any, Callable, TypedDict
from .assertions import assert_exists
from .sleep import Sleep
from .logger import Logger
from .now import now
from .format_exception import format_exception


class RetryOptions(TypedDict):
    max_retries: int
    timeout_seconds: int
    backoff_seconds: int


WithRetry = Callable[[Callable, list[Any], RetryOptions, int], Any]


def provide_with_retry(sleep: Sleep, logger: Logger):
    assert_exists(sleep, 'sleep')
    assert_exists(logger, 'logger')

    async def with_retry(fn: Callable, *args, retry_options: RetryOptions = {'max_retries': 3}, attempt_number: int = 1):
        if attempt_number == 1:
            retry_options['start_time'] = now()
        max_retries = retry_options.get('max_retries')
        timeout_seconds = retry_options.get('timeout_seconds')
        backoff_seconds = retry_options.get('backoff_seconds')
        start_time = retry_options.get('start_time')

        try:
            logger.debug(
                f'trying attempt {attempt_number}/{max_retries} function call with args {args} (options={retry_options}, now={now()})')
            response = await fn(*args)
            # TODO this error check is web3.py specific, ideally should be generalized
            if response and 'error' in response:
                raise Exception(response['error'])
            return response
        except Exception as e:
            logger.debug(
                f'function call threw error (attempt: {attempt_number}): {e}')  # format_exception(e)
            # if timeout was specified and has elapsed
            if timeout_seconds and now() - start_time >= timeout_seconds:
                logger.debug(f'timeout exceeded ({now() - start_time})')
                raise e
            # if max retries was specified
            if max_retries and attempt_number >= max_retries:
                logger.debug('retries exceeded')
                raise e
            # use backoff seconds if specified, else use a default
            backoff = backoff_seconds or attempt_number
            # logger.debug(f'backing off for {backoff} seconds')
            await sleep(backoff)  # wait a bit before trying again

            # increase attempt number and try again
            # logger.debug(f'retrying...')
            return await with_retry(fn, *args, retry_options=retry_options, attempt_number=attempt_number+1)

    return with_retry
