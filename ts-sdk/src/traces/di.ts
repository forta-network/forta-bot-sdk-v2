import { asFunction } from "awilix";
import { provideGetTraceData } from "./get.trace.data";

export default {
  getTraceData: asFunction(provideGetTraceData),
};
