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
      logger.log(
        `trying attempt ${attemptNumber}/${maxRetries} function call with args ${args}`
      );
      const result = await func(...args);
      logger.log(`got result ${result}`);
      return result;
    } catch (e) {
      logger.log(
        `function call threw error (time elapsed: ${Date.now() - startTime}ms)`
      );
      // if timeout was specified and has elapsed
      if (timeoutSeconds && Date.now() - startTime >= 1000 * timeoutSeconds) {
        throw e;
      }
      // if max retries was specified
      if (maxRetries && attemptNumber >= maxRetries) {
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
