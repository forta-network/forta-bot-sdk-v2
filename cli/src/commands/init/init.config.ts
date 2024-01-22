import { join } from "path";
import fs from "fs";
import shelljs from "shelljs";
import { jsonc } from "jsonc";
import { v4 as uuidv4 } from "uuid";
import {
  FortaConfig,
  assertExists,
  assertIsNonEmptyString,
  keccak256,
} from "forta-bot";
import { assertShellResult } from "../../utils/assert";

// create global forta.config.json if doesnt already exist
export type InitConfig = () => Promise<void>;

export function provideInitConfig(
  shell: typeof shelljs,
  filesystem: typeof fs,
  fortaGlobalRoot: string,
  configFilename: string,
  contextPath: string
): InitConfig {
  assertExists(shell, "shell");
  assertExists(filesystem, "filesystem");
  assertIsNonEmptyString(fortaGlobalRoot, "fortaGlobalRoot");
  assertIsNonEmptyString(configFilename, "configFilename");
  assertIsNonEmptyString(contextPath, "contextPath");

  return async function initConfig() {
    const filePath = join(fortaGlobalRoot, configFilename);
    const localFilePath = join(contextPath, configFilename);

    if (!filesystem.existsSync(filePath)) {
      // Create global file
      console.log(`Creating ${configFilename}...`);
      const copyConfigResult = shell.cp(
        join(__dirname, configFilename),
        fortaGlobalRoot
      );
      assertShellResult(copyConfigResult, `Error creating ${configFilename}`);
    } else {
      console.log(
        `Found existing global ${configFilename} in ${fortaGlobalRoot}`
      );
    }

    // Save random botId in initial local forta config
    const botId = keccak256(uuidv4());
    console.log(`Saving botId: ${botId} in local ${configFilename}`);

    const data: FortaConfig = { botId };
    filesystem.writeFileSync(localFilePath, jsonc.stringify(data));
  };
}
