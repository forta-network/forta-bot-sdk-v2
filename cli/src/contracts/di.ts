import { asClass, asFunction } from "awilix";
import { JsonRpcProvider } from "ethers";
import { FortaConfig } from "forta-bot";
import { BotRegistry } from "./bot.registry";
import { FortToken } from "./fort.token";
import { Staking } from "./staking";

export default {
  botRegistry: asClass(BotRegistry),
  botRegistryAddress: asFunction((fortaConfig: FortaConfig) => {
    return (
      fortaConfig.botRegistryAddress ||
      "0x61447385B019187daa48e91c55c02AF1F1f3F863"
    );
  }),

  fortToken: asClass(FortToken),
  fortTokenAddress: asFunction((fortaConfig: FortaConfig) => {
    return (
      fortaConfig.fortTokenAddress ||
      "0x9ff62d1FC52A907B6DCbA8077c2DDCA6E6a9d3e1"
    );
  }),

  staking: asClass(Staking),
  stakingAddress: asFunction((fortaConfig: FortaConfig) => {
    return (
      fortaConfig.stakingAddress || "0xd2863157539b1D11F39ce23fC4834B62082F6874"
    );
  }),
};
