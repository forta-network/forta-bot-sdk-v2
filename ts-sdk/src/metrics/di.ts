import { asClass } from "awilix";
import { MetricsHelper, MetricsManager } from ".";

export default {
  metricsManager: asClass(MetricsManager).singleton(),
  metricsHelper: asClass(MetricsHelper).singleton(),
};
