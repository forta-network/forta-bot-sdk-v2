import { asFunction } from "awilix";
import { provideRun } from "./run";
import { providePush } from "./push";
import { providePublish } from "./publish";
import { providePushToBotRegistry } from "./publish/push.to.bot.registry";
import { provideInit } from "./init";
import { provideInitKeyfile } from "./init/init.keyfile";
import { provideInitConfig } from "./init/init.config";
import { provideEnable } from "./enable";
import { provideDisable } from "./disable";
import { provideKeyfile } from "./keyfile";
import { provideStake } from "./stake";
import { provideRegisterRpcKey } from "./register.rpc.key";

export default {
  init: asFunction(provideInit),
  initKeyfile: asFunction(provideInitKeyfile),
  initConfig: asFunction(provideInitConfig),
  run: asFunction(provideRun),
  publish: asFunction(providePublish),
  pushToBotRegistry: asFunction(providePushToBotRegistry),
  push: asFunction(providePush),
  enable: asFunction(provideEnable),
  disable: asFunction(provideDisable),
  keyfile: asFunction(provideKeyfile),
  stake: asFunction(provideStake),
  registerRpcKey: asFunction(provideRegisterRpcKey),
};
