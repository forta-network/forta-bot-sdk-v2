import { asFunction, asValue } from "awilix";
import { provideRunHealthCheck } from "./run.health.check";

export default {
  runHealthCheck: asFunction(provideRunHealthCheck),
  healthCheckPort: asValue(
    process.env.FORTA_HEALTH_CHECK_PORT
      ? parseInt(process.env.FORTA_HEALTH_CHECK_PORT)
      : 3000
  ),
};
