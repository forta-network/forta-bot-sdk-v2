import shelljs from "shelljs";
import { assertExists, assertIsNonEmptyString } from "@fortanetwork/forta-bot";

// returns a list of keyfiles found in the keystore
export type ListKeyfiles = () => string[];

export function provideListKeyfiles(
  shell: typeof shelljs,
  fortaGlobalRoot: string,
  configFilename: string
): ListKeyfiles {
  assertExists(shell, "shell");
  assertIsNonEmptyString(fortaGlobalRoot, "fortaGlobalRoot");
  assertIsNonEmptyString(configFilename, "configFilename");

  return function listKeyfiles() {
    return shell
      .ls(fortaGlobalRoot)
      .filter(
        (filename) => filename.startsWith("UTC") && filename !== configFilename
      );
  };
}
