import fs from "fs";
import shelljs from "shelljs";
import { assertExists, assertIsNonEmptyString } from "forta-bot";
import { assertShellResult } from "../utils/assert";

// ensures that keystore folder exists (~/.forta)
export type InitKeystore = () => Promise<void>;

export function provideInitKeystore(
  shell: typeof shelljs,
  filesystem: typeof fs,
  fortaGlobalRoot: string
): InitKeystore {
  assertExists(shell, "shell");
  assertExists(filesystem, "filesystem");
  assertIsNonEmptyString(fortaGlobalRoot, "fortaGlobalRoot");

  return async function initKeystore() {
    // make sure keystore folder exists
    if (!filesystem.existsSync(fortaGlobalRoot)) {
      const createKeystoreResult = shell.mkdir(fortaGlobalRoot);
      assertShellResult(
        createKeystoreResult,
        `error creating keystore folder ${fortaGlobalRoot}`
      );
    }
  };
}
