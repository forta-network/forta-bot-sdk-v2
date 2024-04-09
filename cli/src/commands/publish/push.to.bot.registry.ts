import { Signer, JsonRpcProvider } from "ethers";
import { assertExists, assertIsNonEmptyString } from "@fortanetwork/forta-bot";
import { BotRegistry } from "../../contracts";
import { AppendToFile } from "../../utils";

// adds/updates bot manifest reference to bot registry contract
export type PushToBotRegistry = (
  manifestReference: string,
  fromWallet: Signer
) => Promise<void>;

export function providePushToBotRegistry(
  appendToFile: AppendToFile,
  botRegistry: BotRegistry,
  botId: string,
  chainIds: number[] = [1],
  polygonProvider: JsonRpcProvider
): PushToBotRegistry {
  assertExists(appendToFile, "appendToFile");
  assertExists(botRegistry, "botRegistry");
  assertIsNonEmptyString(botId, "botId");
  assertExists(polygonProvider, "polygonProvider");

  return async function pushToBotRegistry(
    manifestReference: string,
    fromWallet: Signer
  ) {
    const fromWalletAddress = await fromWallet.getAddress();

    const [bot, fromWalletBalance] = await Promise.all([
      botRegistry.getAgent(botId),
      polygonProvider.getBalance(fromWalletAddress),
    ]);
    const botExists = bot.created;
    // verify wallet has some balance to pay transaction fee
    if (fromWalletBalance == 0n) {
      throw new Error(
        `${fromWalletAddress} has insufficient MATIC balance to deploy bot`
      );
    }

    if (!botExists) {
      console.log("adding bot to registry...");
      await botRegistry.createAgent(
        fromWallet,
        botId,
        manifestReference,
        chainIds
      );
    } else {
      // verify that the bot is being updated by the owner
      if (fromWalletAddress.toLowerCase() !== bot.owner.toLowerCase()) {
        throw new Error(`bot can only be updated by owner (${bot.owner})`);
      }

      console.log("updating bot in registry...");
      await botRegistry.updateAgent(
        fromWallet,
        botId,
        manifestReference,
        chainIds
      );
    }

    const logMessage = `successfully ${
      botExists ? "updated" : "added"
    } bot id ${botId} with manifest ${manifestReference}`;
    console.log(logMessage);
    appendToFile(`${new Date().toUTCString()}: ${logMessage}`, "publish.log");
  };
}
