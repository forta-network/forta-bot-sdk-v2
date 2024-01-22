import { assertExists, assertIsNonEmptyString } from "./assert";
import { GetFortaConfig } from "./get.forta.config";

export type GetBotId = () => string;

export function provideGetBotId(
  args: any,
  getFortaConfig: GetFortaConfig
): GetBotId {
  assertExists(getFortaConfig, "getFortaConfig");

  return function getBotId() {
    // if botId provided by env vars
    if (process.env.FORTA_BOT_ID) {
      return process.env.FORTA_BOT_ID;
    }

    // check runtime args for botId
    if (args.botId) return args.botId;
    if (args.agentId) return args.agentId;

    // check local config file for botId (or agentId for backwards compatibility)
    const fortaConfig = getFortaConfig();
    if (fortaConfig.agentId) return fortaConfig.agentId;

    assertIsNonEmptyString(fortaConfig.botId!, "botId");
    return fortaConfig.botId!;
  };
}
