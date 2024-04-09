import fs from "fs";
import path from "path";
import { assertExists, assertIsNonEmptyString } from "@fortanetwork/forta-bot";
import { ListKeyfiles } from "./list.keyfiles";

// returns the absolute path and name of the current working keyfile
export type GetKeyfile = () => { path: string; name: string };

export function provideGetKeyfile(
  listKeyfiles: ListKeyfiles,
  filesystem: typeof fs,
  fortaGlobalRoot: string,
  keyfileName?: string
): GetKeyfile {
  assertExists(listKeyfiles, "listKeyfiles");
  assertExists(filesystem, "filesystem");
  assertIsNonEmptyString(fortaGlobalRoot, "fortaGlobalRoot");

  return function getKeyfile() {
    if (!filesystem.existsSync(fortaGlobalRoot)) {
      throw new Error(`keystore folder ${fortaGlobalRoot} not found`);
    }

    const keyfiles = listKeyfiles();
    // if a keyfile name is not specified in config
    if (!keyfileName) {
      // assume only one keyfile in keystore
      keyfileName = keyfiles[0]; // TODO use some better way to select when there are multiple keyfiles
    } else {
      // find the keyfile using the address in the specified filename (can't use filename directly since it may contain path separators)
      const keyfileAddress = keyfileName.substr(
        keyfileName.lastIndexOf("--") + 2
      );
      keyfileName = keyfiles.find((keyfile) =>
        keyfile.endsWith(keyfileAddress)
      )!;
    }

    const keyfilePath = path.join(fortaGlobalRoot, keyfileName);
    if (!filesystem.existsSync(keyfilePath)) {
      throw new Error(`keyfile not found at ${keyfilePath}`);
    }

    return {
      path: keyfilePath,
      name: keyfileName,
    };
  };
}
