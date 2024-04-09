import { asFunction } from "awilix";
import { provideCreateKeyfile } from "./create.keyfile";
import { provideDecryptKeyfile } from "./decrypt.keyfile";
import { provideGetCredentials } from "./get.credentials";
import { provideGetKeyfile } from "./get.keyfile";
import { provideInitKeystore } from "./init.keystore";
import { provideListKeyfiles } from "./list.keyfiles";
import { FortaConfig } from "@fortanetwork/forta-bot";

export default {
  keyfileName: asFunction((fortaConfig: FortaConfig) => {
    return fortaConfig.keyfile;
  }),
  keyfilePassword: asFunction((fortaConfig: FortaConfig) => {
    return fortaConfig.keyfilePassword;
  }).singleton(),
  createKeyfile: asFunction(provideCreateKeyfile),
  decryptKeyfile: asFunction(provideDecryptKeyfile),
  getCredentials: asFunction(provideGetCredentials),
  getKeyfile: asFunction(provideGetKeyfile),
  initKeystore: asFunction(provideInitKeystore),
  listKeyfiles: asFunction(provideListKeyfiles),
};
