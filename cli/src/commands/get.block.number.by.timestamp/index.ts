import { assertExists } from "@fortanetwork/forta-bot";
import shelljs from "shelljs";
import { CommandHandler } from "../..";
import { ChildProcess } from "child_process";

export function provideGetBlockNumberByTimestamp(
  shell: typeof shelljs,
  cliArgs: any
): CommandHandler {
  return async function getBlockNumberByTimestamp(runtimeArgs: any = {}) {
    const args = { ...cliArgs, ...runtimeArgs };
    const { chainId, timestamp } = args;
    assertExists(chainId, "chainId");
    assertExists(timestamp, "timestamp");

    // set the flag to tell the SDK to run a cli command
    process.env["FORTA_CLI"] = "true";
    process.env["FORTA_CHAIN_ID"] = chainId;
    process.env["FORTA_CLI_TIMESTAMP"] = timestamp;

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
