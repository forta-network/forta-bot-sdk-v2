import { join } from "path";
import fs from "fs";
import { assertExists, assertIsNonEmptyString } from "./assert";
import { GetJsonFile } from "./get.json.file";

export type GetFortaConfig = () => FortaConfig;

export interface FortaConfig {
  botId?: string;
  agentId?: string;
  ipfsGatewayUrl?: string;
  ipfsGatewayAuth?: string;
  imageRepositoryUrl?: string;
  imageRepositoryUsername?: string;
  imageRepositoryPassword?: string;
  botRegistryAddress?: string;
  polygonJsonRpcUrl?: string;
  debug?: boolean;
  keyfile?: string;
  keyfilePassword?: string;
  fortaApiUrl?: string;
  fortaApiKey?: string;
  fortTokenAddress?: string;
  stakingAddress?: string;
  tokenExchangeUrl?: string;
  registerKeyIdUrl?: string;
  shouldStopOnErrors?: boolean;
  localRpcUrls?: { [chainId: string]: string };
}

export function provideGetFortaConfig(
  filesystem: typeof fs,
  isProd: boolean,
  configFilename: string,
  localConfigFilename: string,
  fortaGlobalRoot: string,
  getJsonFile: GetJsonFile,
  contextPath: string
): GetFortaConfig {
  assertExists(filesystem, "filesystem");
  assertIsNonEmptyString(configFilename, "configFilename");
  assertIsNonEmptyString(localConfigFilename, "localConfigFilename");
  assertIsNonEmptyString(fortaGlobalRoot, "fortaGlobalRoot");
  assertExists(getJsonFile, "getJsonFile");
  assertIsNonEmptyString(contextPath, "contextPath");

  return function getFortaConfig() {
    let config = {};
    const globalConfigPath = join(fortaGlobalRoot, configFilename);
    const globalConfigExists = filesystem.existsSync(globalConfigPath);
    const localConfigPath = join(contextPath, localConfigFilename);
    const localConfigExists = filesystem.existsSync(localConfigPath);
    const noConfigExists = !globalConfigExists && !localConfigExists;

    // config file will not exist when running "init" or when running in production
    if (noConfigExists || isProd) return config;

    // try to read from global config file
    if (globalConfigExists) {
      try {
        config = Object.assign(config, getJsonFile(globalConfigPath));
      } catch (e) {
        throw new Error(
          `unable to parse config file ${configFilename}: ${e.message}`
        );
      }
    }

    // try to read from local (project-specific) config file
    if (localConfigExists) {
      try {
        config = Object.assign(config, getJsonFile(localConfigPath));
      } catch (e) {
        throw new Error(
          `unable to parse project config file ${localConfigFilename}: ${e.message}`
        );
      }
    }

    return config;
  };
}
