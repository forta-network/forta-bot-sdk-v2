import { GetJsonFile, assertExists } from "@fortanetwork/forta-bot";
import { CommandHandler } from "../..";
import { GetKeyfile } from "../../keys";

export function provideKeyfile(
  getKeyfile: GetKeyfile,
  getJsonFile: GetJsonFile
): CommandHandler {
  assertExists(getKeyfile, "getKeyfile");
  assertExists(getJsonFile, "getJsonFile");

  return async function keyfile() {
    const { path } = getKeyfile();
    const { address } = getJsonFile(path);

    console.log(`path: ${path}`);
    console.log(`address: 0x${address}`);
  };
}
