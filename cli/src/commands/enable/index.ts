import { Wallet } from "ethers";
import { assertExists, assertIsNonEmptyString } from "@fortanetwork/forta-bot";
import { CommandHandler } from "../..";
import { AppendToFile } from "../../utils/append.to.file";
import { GetCredentials } from "../../keys";
import { BotRegistry } from "../../contracts";

export function provideEnable(
  appendToFile: AppendToFile,
  getCredentials: GetCredentials,
  botRegistry: BotRegistry,
  botId: string
): CommandHandler {
  assertExists(appendToFile, "appendToFile");
  assertExists(getCredentials, "getCredentials");
  assertExists(botRegistry, "botRegistry");

  return async function enable() {
    assertIsNonEmptyString(botId, "botId");
    const botExists = await botRegistry.agentExists(botId);
    if (!botExists) {
      throw new Error(`bot id ${botId} does not exist`);
    }

    const isBotEnabled = await botRegistry.isEnabled(botId);
    if (isBotEnabled) {
      console.log(`bot id ${botId} is already enabled`);
      return;
    }

    const { privateKey } = await getCredentials();

    console.log("enabling bot...");
    const fromWallet = new Wallet(privateKey);
    await botRegistry.enableAgent(fromWallet, botId);

    const logMessage = `successfully enabled bot id ${botId}`;
    console.log(logMessage);
    appendToFile(`${new Date().toUTCString()}: ${logMessage}`, "publish.log");
  };
}
