import { asClass, asFunction } from "awilix";
import { provideWithRetry } from "./with.retry";
import { provideGetJsonFile } from "./get.json.file";
import { provideSleep } from "./sleep";
import { provideGetFortaConfig } from "./get.forta.config";
import { provideGetFortaApiUrl } from "./get.forta.api.url";
import { provideGetFortaApiHeaders } from "./get.forta.api.headers";
import { provideGetBotId } from "./get.bot.id";
import { provideGetFortaChainId } from "./get.forta.chain.id";
import { provideGetBotOwner } from "./get.bot.owner";
import { provideGetChainId } from "./get.chain.id";
import { Logger } from "./logger";

export default {
  withRetry: asFunction(provideWithRetry),
  sleep: asFunction(provideSleep),
  getJsonFile: asFunction(provideGetJsonFile),
  getFortaConfig: asFunction(provideGetFortaConfig),
  getFortaApiUrl: asFunction(provideGetFortaApiUrl),
  getFortaApiHeaders: asFunction(provideGetFortaApiHeaders),
  getBotId: asFunction(provideGetBotId),
  getFortaChainId: asFunction(provideGetFortaChainId),
  getBotOwner: asFunction(provideGetBotOwner),
  getChainId: asFunction(provideGetChainId),
  logger: asClass(Logger).singleton(),
};
