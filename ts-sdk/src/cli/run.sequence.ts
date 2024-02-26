import { JsonRpcProvider } from "ethers";
import { ScanEvmOptions } from "../scanning";
import { assertExists } from "../utils";
import { RunHandlersOnBlock } from "../blocks";
import { RunHandlersOnTransaction } from "../transactions";
import { RunHandlersOnAlert } from "../alerts";

// runs handlers against a sequence of blocks/transactions/alerts
export type RunSequence = (
  sequence: string,
  options: ScanEvmOptions,
  provider: JsonRpcProvider,
  chainId: number
) => Promise<void>;

export function provideRunSequence(
  runHandlersOnBlock: RunHandlersOnBlock,
  runHandlersOnTransaction: RunHandlersOnTransaction,
  runHandlersOnAlert: RunHandlersOnAlert
): RunSequence {
  assertExists(runHandlersOnBlock, "runHandlerOnBlock");
  assertExists(runHandlersOnTransaction, "runHandlerOnTransaction");
  assertExists(runHandlersOnAlert, "runHandlerOnAlert");

  return async function runSequence(
    sequence: string,
    options: ScanEvmOptions,
    provider: JsonRpcProvider,
    chainId: number
  ) {
    let steps = [sequence];
    if (sequence.includes(",")) {
      steps = sequence.split(",");
    }

    for (const step of steps) {
      if (step.startsWith("tx")) {
        // transaction step
        await runHandlersOnTransaction(
          step.substring(2),
          options,
          provider,
          chainId
        );
      } else if (step.startsWith("0x")) {
        // alert step
        // await runHandlersOnAlert(step, options);
      } else {
        // block step
        await runHandlersOnBlock(parseInt(step), options, provider, chainId);
      }
    }
  };
}
