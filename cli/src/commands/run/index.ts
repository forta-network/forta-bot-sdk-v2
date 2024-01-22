import { assertExists } from "forta-bot/dist/utils";
import shelljs from "shelljs";
import { CommandHandler } from "../..";

export function provideRun(
  shell: typeof shelljs,
  cliArgs: any
): CommandHandler {
  assertExists(shell, "shell");

  return async function run(runtimeArgs: any = {}) {
    const args = { ...cliArgs, ...runtimeArgs };
    const { chainId, tx, block, alert, sequence, range, file } = args;

    // set the flag to tell the SDK to run a cli command
    process.env["FORTA_CLI"] = "true";

    // if a chain id was specified, set the env var
    if (chainId) {
      process.env["FORTA_CHAIN_ID"] = chainId;
    }

    // set the appropriate env var for the command being run
    if (tx) {
      process.env["FORTA_CLI_TX"] = tx;
    } else if (block) {
      process.env["FORTA_CLI_BLOCK"] = block;
    } else if (alert) {
      process.env["FORTA_CLI_ALERT"] = alert;
    } else if (sequence) {
      process.env["FORTA_CLI_SEQUENCE"] = sequence;
    } else if (range) {
      process.env["FORTA_CLI_RANGE"] = range;
    } else if (file) {
      process.env["FORTA_CLI_FILE"] = file;
    } else {
      delete process.env["FORTA_CLI"]; // when running "forta-bot run" let the bot run normally
      process.env["FORTA_CLI_RUN"] = "true";
    }

    // if caching is explicity disabled, set the env var
    if ("nocache" in args) {
      process.env["FORTA_CLI_NO_CACHE"] = "true";
    }

    // run the bot
    shell.exec("npm start");
  };
}
