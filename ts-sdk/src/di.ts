import os from "os";
import fs from "fs";
import { join } from "path";
import { InjectionMode, asFunction, asValue, createContainer } from "awilix";
import axios from "axios";
import flatCache from "flat-cache";
import alertsModuleBindings from "./alerts/di";
import blocksModuleBindings from "./blocks/di";
import cliModuleBindings from "./cli/di";
import healthModuleBindings from "./health/di";
import jwtModuleBindings from "./jwt/di";
import labelsModuleBindings from "./labels/di";
import scanningModuleBindings from "./scanning/di";
import tracesModuleBindings from "./traces/di";
import transactionsModuleBindings from "./transactions/di";
import logsModuleBindings from "./logs/di";
import metricsModuleBindings from "./metrics/di";
import utilsModuleBindings from "./utils/di";
import { FortaConfig, GetBotId, GetFortaConfig, GetJsonFile } from "./utils";

export default function configureContainer(args: any = {}) {
  const container = createContainer({ injectionMode: InjectionMode.CLASSIC });

  const bindings = {
    container: asValue(container),
    args: asValue(args),
    fortaGlobalRoot: asValue(join(os.homedir(), ".forta")),
    isProd: asValue(
      process.env.FORTA_ENV === "production" ||
        process.env.NODE_ENV === "production"
    ),
    isRunningCliCommand: asValue("FORTA_CLI" in process.env),
    filesystem: asValue(fs),
    axios: asValue(axios),
    cache: asFunction((fortaGlobalRoot: string) =>
      flatCache.load("forta-bot-cache", fortaGlobalRoot)
    ).singleton(),
    configFilename: asValue("forta.config.json"),
    localConfigFilename: asFunction((configFilename: string) => {
      return args.config || configFilename;
    }).singleton(),
    contextPath: asValue(args.contextPath || process.cwd()), // the directory containing the bot's package.json
    fortaConfig: asFunction((getFortaConfig: GetFortaConfig) =>
      getFortaConfig()
    ).singleton(),
    shouldStopOnErrors: asFunction(
      (fortaConfig: FortaConfig, isProd: boolean) => {
        if (fortaConfig.shouldStopOnErrors != undefined) {
          return fortaConfig.shouldStopOnErrors;
        }

        return !isProd; // stop execution on errors by default in dev
      }
    ),

    fortaChainId: asValue(
      process.env.FORTA_CHAIN_ID
        ? parseInt(process.env.FORTA_CHAIN_ID)
        : undefined
    ),
    fortaBotOwner: asValue(process.env.FORTA_BOT_OWNER),
    fortaShardId: asValue(
      process.env.FORTA_SHARD_ID
        ? parseInt(process.env.FORTA_SHARD_ID)
        : undefined
    ),
    fortaShardCount: asValue(
      process.env.FORTA_SHARD_COUNT
        ? parseInt(process.env.FORTA_SHARD_COUNT)
        : undefined
    ),

    packageJson: asFunction((contextPath: string, getJsonFile: GetJsonFile) => {
      try {
        const packageJsonPath = join(contextPath, "package.json");
        return getJsonFile(packageJsonPath);
      } catch (e) {
        throw new Error(`unable to parse package.json: ${e.message}`);
      }
    }).singleton(),
    botName: asFunction((packageJson: any) => packageJson.name).singleton(),
    botId: asFunction((getBotId: GetBotId) => {
      return getBotId();
    }).singleton(),
    botDisplayName: asFunction(
      (packageJson: any) => packageJson.displayName
    ).singleton(),
    description: asFunction(
      (packageJson: any) => packageJson.description
    ).singleton(),
    longDescription: asFunction(
      (packageJson: any) => packageJson.longDescription
    ).singleton(),
    chainIds: asFunction((packageJson: any) => {
      const { chainIds } = packageJson;
      if (!chainIds) return undefined;

      if (!chainIds.length) {
        throw new Error(
          "please specify chainIds array in package.json for where this bot should deploy e.g. [1] (for Ethereum mainnet)"
        );
      }
      return chainIds.sort((a: number, b: number) => a - b); // sort by ascending integers
    }).singleton(),
    chainSettings: asFunction((packageJson: any) => {
      const { chainSettings } = packageJson;
      if (typeof chainSettings === "object") {
        return chainSettings;
      }
      return undefined;
    }).singleton(),
    version: asFunction((packageJson: any) => packageJson.version),
    documentation: asFunction((contextPath: string) => {
      return join(contextPath, "README.md");
    }).singleton(),
    repository: asFunction((packageJson: any) => {
      const repository = packageJson.repository;
      if (typeof repository === "string") {
        return repository;
      } else if (typeof repository === "object") {
        return repository.url;
      }
      return undefined;
    }).singleton(),
    licenseUrl: asFunction(
      (packageJson: any) => packageJson.licenseUrl
    ).singleton(),
    promoUrl: asFunction(
      (packageJson: any) => packageJson.promoUrl
    ).singleton(),
    external: asFunction(
      (packageJson: any) =>
        packageJson.external === true || packageJson.external === "true"
    ).singleton(),

    ...alertsModuleBindings,
    ...blocksModuleBindings,
    ...cliModuleBindings,
    ...healthModuleBindings,
    ...jwtModuleBindings,
    ...labelsModuleBindings,
    ...logsModuleBindings,
    ...metricsModuleBindings,
    ...scanningModuleBindings,
    ...tracesModuleBindings,
    ...transactionsModuleBindings,
    ...utilsModuleBindings,
  };

  container.register(bindings);
  return container;
}
