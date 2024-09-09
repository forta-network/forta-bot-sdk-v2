import { assertExists } from "@fortanetwork/forta-bot";
import shelljs from "shelljs";
import { CommandHandler } from "../..";
import { ChildProcess } from "child_process";

export function provideRun(
  shell: typeof shelljs,
  cliArgs: any
): CommandHandler {
  assertExists(shell, "shell");

  return async function run(runtimeArgs: any = {}) {
    const args = { ...cliArgs, ...runtimeArgs };
    const {
      chainId,
      tx,
      block,
      alert,
      sequence,
      range,
      file,
      output,
      addresses,
    } = args;

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

    // if an output file was specified, set the env var
    if (output) {
      process.env["FORTA_CLI_OUTPUT"] = output;
    }

    // if a filter addresses were specified, set the env var
    if (addresses) {
      process.env["FORTA_CLI_ADDRESSES"] = addresses;
    }

    // if caching is explicity disabled, set the env var
    if ("nocache" in args) {
      process.env["FORTA_CLI_NO_CACHE"] = "true";
    }

    // if logs from SDK are disabled, set the env var
    if ("nologs" in args) {
      process.env["FORTA_CLI_DISABLE_LOGS"] = "true";
    }

    // if max retries for json-rpc requests is provided, set the env var
    if ("maxretries" in args) {
      process.env["FORTA_CLI_MAX_RETRIES"] = args.maxretries;
    }

    // run the bot in a child process
    let childProcess: ChildProcess;
    process.on("SIGINT", function () {
      if (childProcess != undefined) {
        // pass any sigint signal to the child
        childProcess.kill();
      }
    });
    childProcess = shell.exec("npm start", { async: true });
  };
}
