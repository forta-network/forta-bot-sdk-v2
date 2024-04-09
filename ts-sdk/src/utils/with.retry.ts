import { assertExists } from "./assert";
import { Sleep } from "./sleep";
import { Logger } from "./logger";

// execute a function with args based on the retry options provided
// adapted from https://tusharf5.com/posts/type-safe-retry-function-in-typescript/
export type WithRetry = <T extends (...arg0: any[]) => any>(
  func: T,
  args: Parameters<T>,
  retryOptions?: RetryOptions,
  attemptNumber?: number,
  startTimeMs?: number
) => Promise<Awaited<ReturnType<T>>>;

export type RetryOptions = {
  maxRetries?: number;
  timeoutSeconds?: number;
  backoffSeconds?: number;
  startTime?: number;
};

export function provideWithRetry(sleep: Sleep, logger: Logger): WithRetry {
  assertExists(sleep, "sleep");
  assertExists(logger, "logger");

  return async function withRetry<T extends (...arg0: any[]) => any>(
    func: T,
    args: Parameters<T>,
    retryOptions: RetryOptions = { maxRetries: 3 },
    attemptNumber: number = 1,
    startTime: number = Date.now()
  ): Promise<Awaited<ReturnType<T>>> {
    let { maxRetries, timeoutSeconds, backoffSeconds } = retryOptions;

    try {
      logger.debug(
        `trying attempt ${attemptNumber}/${maxRetries} function call with args ${args} (options=${JSON.stringify(
          retryOptions
        )}, start=${startTime}, now=${Date.now()})`
      );
      const result = await func(...args);
      return result;
    } catch (e) {
      const elapsed = Date.now() - startTime;
      logger.debug(`function call threw error (elapsed: ${elapsed}ms): ${e}`);
      // if timeout was specified and has elapsed
      if (timeoutSeconds && elapsed >= 1000 * timeoutSeconds) {
        logger.debug(`timeout exceeded (${elapsed})`);
        throw e;
      }
      // if max retries was specified
      if (maxRetries && attemptNumber >= maxRetries) {
        logger.debug(`retries exceeded`);
        throw e;
      }

      // use backoffSeconds if specified, else use a default
      const backoffMs = backoffSeconds
        ? 1000 * backoffSeconds
        : 1000 * attemptNumber;
      await sleep(backoffMs); // wait a bit before trying again

      // increase attempt number and try again
      return withRetry(func, args, retryOptions, attemptNumber + 1, startTime);
    }
  };
}
