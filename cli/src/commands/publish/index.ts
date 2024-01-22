import { Wallet } from "ethers";
import { assertExists } from "forta-bot";
import { CommandHandler } from "../..";
import { GetCredentials } from "../../keys";
import { UploadBotImage, UploadBotManifest } from "../../utils";
import { PushToBotRegistry } from "./push.to.bot.registry";

export function providePublish(
  getCredentials: GetCredentials,
  uploadBotImage: UploadBotImage,
  uploadBotManifest: UploadBotManifest,
  pushToBotRegistry: PushToBotRegistry,
  external: boolean
): CommandHandler {
  assertExists(getCredentials, "getCredentials");
  assertExists(uploadBotImage, "uploadBotImage");
  assertExists(uploadBotManifest, "uploadBotManifest");
  assertExists(pushToBotRegistry, "pushToRegistry");

  return async function publish() {
    let imageReference;
    // external bots do not have docker images so no need to upload one
    if (!external) {
      imageReference = await uploadBotImage();
    }
    const { privateKey } = await getCredentials();
    const manifestReference = await uploadBotManifest(
      imageReference,
      privateKey
    );
    await pushToBotRegistry(manifestReference, new Wallet(privateKey));
  };
}
