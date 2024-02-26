import { JsonRpcProvider } from "ethers";
import { ScanEvmOptions } from "../scanning";
import { RunSequence } from "./run.sequence";
import { GetJsonFile, Logger, assertExists } from "../utils";
import { RunHandlersOnBlock } from "../blocks";
import { RunHandlersOnTransaction } from "../transactions";
import { RunHandlersOnAlert } from "../alerts";

// runs handlers against a specified json file with test data
export type RunFile = (
  filePath: string,
  options: ScanEvmOptions,
  provider: JsonRpcProvider,
  chainId: number
) => Promise<void>;

export function provideRunFile(
  getJsonFile: GetJsonFile,
  runHandlersOnBlock: RunHandlersOnBlock,
  runHandlersOnTransaction: RunHandlersOnTransaction,
  runHandlersOnAlert: RunHandlersOnAlert,
  runSequence: RunSequence,
  logger: Logger
): RunFile {
  assertExists(getJsonFile, "getJsonFile");
  assertExists(runHandlersOnBlock, "runHandlersOnBlock");
  assertExists(runHandlersOnTransaction, "runHandlersOnTransaction");
  assertExists(runHandlersOnAlert, "runHandlersOnAlert");
  assertExists(runSequence, "runSequence");
  assertExists(logger, "logger");

  return async function runFile(
    filePath: string,
    options: ScanEvmOptions,
    provider: JsonRpcProvider,
    chainId: number
  ) {
    const { handleBlock, handleTransaction } = options;
    if (!handleBlock && !handleTransaction) {
      throw new Error("no block/transaction handler provided");
    }

    logger.log("parsing file data...");
    const { transactionEvents, blockEvents, alertEvents, sequenceEvents } =
      getJsonFile(filePath);

    if (handleBlock && blockEvents?.length) {
      logger.log("running block events...");
      for (const blockEvent of blockEvents) {
        if (typeof blockEvent === "string" || typeof blockEvent === "number") {
          await runHandlersOnBlock(blockEvent, options, provider, chainId);
        } else {
          const findings = await handleBlock(blockEvent, provider);
          logger.log(
            `${findings.length} findings for block ${blockEvent.hash} ${findings}`
          );
        }
      }
    }

    if (handleTransaction && transactionEvents?.length) {
      logger.log("running transaction events...");
      for (const transactionEvent of transactionEvents) {
        if (typeof transactionEvent === "string") {
          await runHandlersOnTransaction(
            transactionEvent,
            options,
            provider,
            chainId
          );
        } else {
          const findings = await handleTransaction(transactionEvent, provider);
          logger.log(
            `${findings.length} findings for transaction ${transactionEvent.transaction.hash} ${findings}`
          );
        }
      }
    }

    // if (handleAlert && alertEvents?.length) {
    //   logger.log("running alert events...");
    //   for (const alertEvent of alertEvents) {
    //     if (typeof alertEvent === "string") {
    //       // await runHandlersOnAlert(alertEvent, options, provider, chainId);
    //     } else {
    //       const findings = await handleAlert(alertEvent);
    //       logger.log(
    //         `${findings.length} findings for alert ${alertEvent.alert.hash} ${findings}`
    //       );
    //     }
    //   }
    // }

    if (sequenceEvents?.length) {
      for (const sequence of sequenceEvents) {
        await runSequence(sequence, options, provider, chainId);
      }
    }
  };
}
