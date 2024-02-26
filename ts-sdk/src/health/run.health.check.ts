import http from "http";
import url from "url";
import { HealthCheck } from "../handlers";
import { MetricsManager } from "../metrics";
import { Logger, assertExists } from "../utils";

export type RunHealthCheck = (handler?: HealthCheck) => Promise<void>;

export function provideRunHealthCheck(
  healthCheckPort: number,
  metricsManager: MetricsManager,
  logger: Logger
): RunHealthCheck {
  assertExists(metricsManager, "metricsManager");
  assertExists(logger, "logger");

  return async function runHealthCheck(handler?: HealthCheck) {
    const server = http.createServer();
    server.on("request", async (req, res) => {
      const path = url.parse(req.url!).pathname;
      if (path == "/health") {
        res.statusCode = 200;
        let errors: string[] = [];
        try {
          if (handler) {
            const response = await handler();
            if (response && response.length > 0) {
              errors = response;
            }
          }
        } catch (e) {
          logger.error(`${new Date().toISOString()}    healthCheck`);
          logger.error(e);
          res.statusCode = 500;
          errors = [e.message];
        }
        res.end(
          JSON.stringify({
            errors,
            metrics: metricsManager.flushMetrics(),
          })
        );
      }
    });

    server.listen(healthCheckPort);
  };
}
