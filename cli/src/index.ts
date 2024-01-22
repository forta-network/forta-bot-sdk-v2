#!/usr/bin/env node
import yargs, { Argv } from "yargs";
import configureContainer from "./di";

type CommandName =
  | "init"
  | "run"
  | "publish"
  | "push"
  | "disable"
  | "enable"
  | "keyfile"
  | "logs"
  | "info"
  | "stake"
  | "registerRpcKey";

export type CommandHandler = (args?: any) => Promise<void>;

async function executeCommand(cliCommandName: CommandName, cliArgs: any) {
  try {
    const diContainer = configureContainer({ ...cliArgs, cliCommandName });
    const command = diContainer.resolve<CommandHandler>(cliCommandName);
    await command();
  } catch (e) {
    console.error(`ERROR: ${e}`);
    process.exit(1);
  }
}

yargs
  .command(
    "init",
    "Initialize a Forta Bot project",
    (yargs: Argv) => {
      yargs
        .option("javascript", {
          description: "Initialize as Javascript project",
        })
        .option("python", {
          description: "Initialize as Python project",
        });
    },
    (cliArgs: any) => executeCommand("init", cliArgs)
  )
  .command(
    "info",
    "Inspect state of the Forta Bot",
    (yargs: Argv) => {
      yargs.option("botId", {
        description:
          "Bot ID to retrieve information for. Default value is this bot",
        type: "string",
      });
    },
    (cliArgs: any) => executeCommand("info", cliArgs)
  )
  .command(
    "run",
    "Run the Forta Bot with latest blockchain data",
    (yargs: Argv) => {
      yargs
        .option("tx", {
          description: "Run with the specified transaction hash",
          type: "string",
        })
        .option("block", {
          description: "Run with the specified block hash/number",
          type: "string",
        })
        .option("alert", {
          description: "Run with the specified alert hash",
          type: "string",
        })
        .option("sequence", {
          description:
            "Run with the specified sequence of transaction hash, block number or alert hash",
          type: "string",
        })
        .option("range", {
          description: "Run with the specified block range (e.g. 15..20)",
          type: "string",
        })
        .option("file", {
          description: "Run with the specified json file",
          type: "string",
        })
        .option("config", {
          description: "Specify a config file (default: forta.config.json)",
          type: "string",
        })
        .option("nocache", {
          description:
            "Disables writing to the cache (but reads are still enabled)",
          type: "string",
        });
    },
    (cliArgs: any) => executeCommand("run", cliArgs)
  )
  .command(
    "publish",
    "Publish the Forta Bot to the network",
    (yargs: Argv) => {
      yargs.option("config", {
        description: "Specify a config file (default: forta.config.json)",
        type: "string",
      });
    },
    (cliArgs: any) => executeCommand("publish", cliArgs)
  )
  .command(
    "push",
    "Push the Forta Bot image to the repository",
    (yargs: Argv) => {
      yargs
        .option("config", {
          description: "Specify a config file (default: forta.config.json)",
          type: "string",
        })
        .option("manifest", {
          description: "Uploads the manifest after pushing the image",
          type: "boolean",
        });
    },
    (cliArgs: any) => executeCommand("push", cliArgs)
  )
  .command(
    "stake",
    "Stake on a Forta Bot",
    (yargs: Argv) => {
      yargs.option("botId", {
        description: "Specify a bot to stake on (defaults to this bot)",
        type: "string",
      });
    },
    (cliArgs: any) => executeCommand("stake", cliArgs)
  )
  .command(
    "disable",
    "Disables this Forta Bot",
    (yargs: Argv) => {},
    (cliArgs: any) => executeCommand("disable", cliArgs)
  )
  .command(
    "enable",
    "Enables this Forta Bot",
    (yargs: Argv) => {},
    (cliArgs: any) => executeCommand("enable", cliArgs)
  )
  .command(
    "keyfile",
    "Prints out keyfile information",
    (yargs: Argv) => {},
    (cliArgs: any) => executeCommand("keyfile", cliArgs)
  )
  .command(
    "logs",
    "Retrieve logs for a Forta Bot",
    (yargs: Argv) => {
      yargs
        .option("after", {
          description:
            "An ISO timestamp representing the earliest time to include in logs",
          type: "string",
        })
        .option("before", {
          description:
            "An ISO timestamp representing the latest time to include in logs",
          type: "string",
        })
        .option("scannerId", {
          description: "Only returns logs for specified scannerId",
          type: "string",
        })
        .option("botId", {
          description: "Bot ID to retrieve logs for (defaults to this bot)",
          type: "string",
        });
    },
    (cliArgs: any) => executeCommand("logs", cliArgs)
  )
  .command(
    "registerRpcKey",
    "Register a RPC key with Forta (for authenticated RPC enpdoints)",
    (yargs: Argv) => {
      yargs.option("key", {
        description: "RPC key ID to register",
        type: "string",
      });
    },
    (cliArgs: any) => executeCommand("registerRpcKey", cliArgs)
  ).argv;
