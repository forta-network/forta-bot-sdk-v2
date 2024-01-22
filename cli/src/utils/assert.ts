import { ShellString } from "shelljs";

export const assertShellResult = (result: ShellString, errMsg: string) => {
  if (result.code !== 0) {
    throw new Error(`${errMsg}: ${result.stderr}`);
  }
};

export const assertIsValidChainSettings = (chainSettings?: any) => {
  if (!chainSettings) {
    return;
  }
  for (let key in chainSettings) {
    if (key == "default") {
      continue;
    }
    if (isNaN(parseInt(key))) {
      throw new Error(
        "keys in chainSettings must be numerical string or default"
      );
    }
  }
};
