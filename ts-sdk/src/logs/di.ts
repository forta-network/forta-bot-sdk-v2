import { asFunction } from "awilix";
import { provideFilterLogs } from "./filter.logs";
import { provideGetLogsForBlock } from "./get.logs.for.block";

export default {
  filterLogs: asFunction(provideFilterLogs),
  getLogsForBlock: asFunction(provideGetLogsForBlock),
};
