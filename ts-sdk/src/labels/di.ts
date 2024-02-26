import { asFunction } from "awilix";
import { provideGetLabels } from "./get.labels";

export default {
  getLabels: asFunction(provideGetLabels),
};
