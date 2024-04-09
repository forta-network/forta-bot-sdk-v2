import { Wallet } from "ethers";
import { CommandHandler } from "../..";
import { AppendToFile } from "../../utils";
import { GetCredentials } from "../../keys";
import { BotRegistry } from "../../contracts";
import { assertExists, assertIsNonEmptyString } from "@fortanetwork/forta-bot";

export function provideDisable(
  appendToFile: AppendToFile,
  getCredentials: GetCredentials,
  botRegistry: BotRegistry,
  botId: string
): CommandHandler {
  assertExists(appendToFile, "appendToFile");
  assertExists(getCredentials, "getCredentials");
  assertExists(botRegistry, "botRegistry");
  assertIsNonEmptyString(botId, "botId");

  return async function disable() {
    const botExists = await botRegistry.agentExists(botId);
    if (!botExists) {
      throw new Error(`bot id ${botId} does not exist`);
    }

    const isBotEnabled = await botRegistry.isEnabled(botId);
    if (!isBotEnabled) {
      console.log(`bot id ${botId} is already disabled`);
      return;
    }

    const { privateKey } = await getCredentials();

    console.log("disabling bot...");
    const fromWallet = new Wallet(privateKey);
    await botRegistry.disableAgent(fromWallet, botId);

    const logMessage = `successfully disabled bot id ${botId}`;
    console.log(logMessage);
    appendToFile(`${new Date().toUTCString()}: ${logMessage}`, "publish.log");
  };
}
