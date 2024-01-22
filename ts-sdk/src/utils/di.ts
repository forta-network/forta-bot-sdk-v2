import { asFunction } from "awilix";
import { provideWithRetry } from "./with.retry";
import { provideGetJsonFile } from "./get.json.file";
import { provideSleep } from "./sleep";
import { provideGetFortaConfig } from "./get.forta.config";
import { provideGetFortaApiUrl } from "./get.forta.api.url";
import { provideGetFortaApiHeaders } from "./get.forta.api.headers";
import { provideGetBotId } from "./get.bot.id";
import { provideGetChainId } from "./get.chain.id";
import { provideGetBotOwner } from "./get.bot.owner";
import { provideGetNetworkId } from "./get.network.id";

export default {
  withRetry: asFunction(provideWithRetry),
  sleep: asFunction(provideSleep),
  getJsonFile: asFunction(provideGetJsonFile),
  getFortaConfig: asFunction(provideGetFortaConfig),
  getFortaApiUrl: asFunction(provideGetFortaApiUrl),
  getFortaApiHeaders: asFunction(provideGetFortaApiHeaders),
  getBotId: asFunction(provideGetBotId),
  getChainId: asFunction(provideGetChainId),
  getBotOwner: asFunction(provideGetBotOwner),
  getNetworkId: asFunction(provideGetNetworkId),
};
