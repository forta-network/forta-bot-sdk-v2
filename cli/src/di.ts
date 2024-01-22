import { InjectionMode, asFunction, asValue, createContainer } from "awilix";
import shell from "shelljs";
import prompts from "prompts";
import { JsonRpcProvider } from "ethers";
import {
  FortaConfig,
  GetJsonFile,
  configureContainer as configureSdkContainer,
} from "forta-bot";
import commandsModuleBindings from "./commands/di";
import contractsModuleBindings from "./contracts/di";
import keysModuleBindings from "./keys/di";
import utilsModuleBindings from "./utils/di";
import { join } from "path";

export default function configureContainer(cliArgs: any = {}) {
  const container = createContainer({ injectionMode: InjectionMode.CLASSIC });
  const sdkContainer = configureSdkContainer(cliArgs);

  const bindings = {
    cliArgs: asValue(cliArgs),
    shell: asFunction(() => {
      shell.config.silent = false;
      return shell;
    }).singleton(),
    prompt: asValue(prompts),
    cliCommandName: asValue<string>(cliArgs.cliCommandName),
    cliVersion: asFunction((getJsonFile: GetJsonFile) => {
      try {
        // in the distributed npm package, the package.json will be 2 levels above this file
        const packageJsonPath = join(__dirname, "..", "package.json");
        const packageJson = getJsonFile(packageJsonPath);
        return packageJson.version;
      } catch (e) {
        throw new Error(`unable to parse cli package.json: ${e.message}`);
      }
    }).singleton(),
    polygonJsonRpcUrl: asFunction((fortaConfig: FortaConfig) => {
      const url = fortaConfig.polygonJsonRpcUrl || "https://polygon-rpc.com/";
      if (!url.startsWith("http")) {
        throw new Error(`polygonJsonRpcUrl must begin with http(s)`);
      }
      return url;
    }),
    polygonProvider: asFunction(
      (polygonJsonRpcUrl: string) => new JsonRpcProvider(polygonJsonRpcUrl)
    ).singleton(),

    fortaGlobalRoot: asValue(sdkContainer.resolve("fortaGlobalRoot")),
    isProd: asValue(sdkContainer.resolve("isProd")),
    axios: asValue(sdkContainer.resolve("axios")),
    cache: asValue(sdkContainer.resolve("cache")),
    args: asValue(sdkContainer.resolve("args")),
    filesystem: asValue(sdkContainer.resolve("filesystem")),
    contextPath: asValue(sdkContainer.resolve("contextPath")),
    configFilename: asValue(sdkContainer.resolve("configFilename")),
    getJsonFile: asValue(sdkContainer.resolve("getJsonFile")),
    fortaConfig: asValue(sdkContainer.resolve("fortaConfig")),
    botId: asValue(sdkContainer.resolve("botId")),
    botName: asValue(sdkContainer.resolve("botName")),
    version: asValue(sdkContainer.resolve("version")),
    botDisplayName: asValue(sdkContainer.resolve("botDisplayName")),
    description: asValue(sdkContainer.resolve("description")),
    longDescription: asValue(sdkContainer.resolve("longDescription")),
    chainIds: asValue(sdkContainer.resolve("chainIds")),
    chainSettings: asValue(sdkContainer.resolve("chainSettings")),
    documentation: asValue(sdkContainer.resolve("documentation")),
    repository: asValue(sdkContainer.resolve("repository")),
    licenseUrl: asValue(sdkContainer.resolve("licenseUrl")),
    promoUrl: asValue(sdkContainer.resolve("promoUrl")),
    external: asValue(sdkContainer.resolve("external")),
    registerKeyIdUrl: asValue(sdkContainer.resolve("registerKeyIdUrl")),

    ...commandsModuleBindings,
    ...contractsModuleBindings,
    ...keysModuleBindings,
    ...utilsModuleBindings,
  };

  container.register(bindings);
  return container;
}
