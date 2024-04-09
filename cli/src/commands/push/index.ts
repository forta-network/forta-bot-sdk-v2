import { assertExists } from "@fortanetwork/forta-bot";
import { CommandHandler } from "../..";
import { GetCredentials } from "../../keys";
import { AppendToFile, UploadBotImage, UploadBotManifest } from "../../utils";

export function providePush(
  getCredentials: GetCredentials,
  uploadBotImage: UploadBotImage,
  uploadBotManifest: UploadBotManifest,
  appendToFile: AppendToFile,
  args: any
): CommandHandler {
  assertExists(getCredentials, "getCredentials");
  assertExists(uploadBotImage, "uploadBotImage");
  assertExists(uploadBotManifest, "uploadBotManifest");
  assertExists(appendToFile, "appendToFile");
  assertExists(args, "args");

  return async function push() {
    const imageReference = await uploadBotImage();

    const logMessage = `successfully pushed bot image with reference ${imageReference}`;
    console.log(logMessage);
    appendToFile(`${new Date().toUTCString()}: ${logMessage}`, "publish.log");

    if (!args.manifest) {
      return;
    }

    const { privateKey } = await getCredentials();
    const manifestReference = await uploadBotManifest(
      imageReference,
      privateKey
    );
    console.log(manifestReference);
    appendToFile(
      `${new Date().toUTCString()}: successfully uploaded bot manifest with reference ${manifestReference}`,
      "publish.log"
    );
  };
}
