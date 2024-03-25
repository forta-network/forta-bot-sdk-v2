import { JsonRpcProvider } from "ethers";
import { ScanAlertsOptions, ScanEvmOptions } from "../scanning";
import { assertExists } from "../utils";
import { RunTransaction } from "./run.transaction";
import { RunBlock } from "./run.block";
import { RunAlert } from "./run.alert";
import { RunSequence } from "./run.sequence";
import { RunBlockRange } from "./run.block.range";
import { RunFile } from "./run.file";
import { Cache } from "../cache";

export type RunCliCommand = (options: RunCliCommandOptions) => Promise<void>;

export interface RunCliCommandOptions {
  scanEvmOptions?: ScanEvmOptions;
  provider?: JsonRpcProvider;
  chainId?: number;
  scanAlertsOptions?: ScanAlertsOptions;
}

export function provideRunCliCommand(
  runTransaction: RunTransaction,
  runBlock: RunBlock,
  runAlert: RunAlert,
  runSequence: RunSequence,
  runBlockRange: RunBlockRange,
  runFile: RunFile,
  cache: Cache
): RunCliCommand {
  assertExists(runTransaction, "runTransaction");
  assertExists(runBlock, "runBlock");
  assertExists(runAlert, "runAlert");
  assertExists(runSequence, "runSequence");
  assertExists(runBlockRange, "runBlockRange");
  assertExists(runFile, "runFile");
  assertExists(cache, "cache");

  return async function runCliCommand(options: RunCliCommandOptions) {
    const { scanEvmOptions, provider, chainId, scanAlertsOptions } = options;
    const {
      FORTA_CHAIN_ID,
      FORTA_CLI_TX,
      FORTA_CLI_BLOCK,
      FORTA_CLI_ALERT,
      FORTA_CLI_SEQUENCE,
      FORTA_CLI_RANGE,
      FORTA_CLI_FILE,
    } = process.env;

    // need to specify chainId if running block/tx/range
    if (FORTA_CLI_BLOCK || FORTA_CLI_TX || FORTA_CLI_RANGE) {
      assertExists(FORTA_CHAIN_ID, "chainId");
    }

    if (FORTA_CLI_TX && isCorrectChainId(FORTA_CHAIN_ID, chainId)) {
      await runTransaction(FORTA_CLI_TX, scanEvmOptions!, provider!, chainId!);
    } else if (FORTA_CLI_BLOCK && isCorrectChainId(FORTA_CHAIN_ID, chainId)) {
      await runBlock(FORTA_CLI_BLOCK, scanEvmOptions!, provider!, chainId!);
    } else if (FORTA_CLI_RANGE && isCorrectChainId(FORTA_CHAIN_ID, chainId)) {
      await runBlockRange(
        FORTA_CLI_RANGE,
        scanEvmOptions!,
        provider!,
        chainId!
      );
    } else if (FORTA_CLI_ALERT && scanAlertsOptions) {
      await runAlert(FORTA_CLI_ALERT, scanAlertsOptions);
    } else if (FORTA_CLI_SEQUENCE) {
      throw new Error("sequence command not implemented yet");
      // await runSequence(FORTA_CLI_SEQUENCE, options, provider, chainId);
    } else if (FORTA_CLI_FILE) {
      throw new Error("file command not implemented yet");
      // await runFile(FORTA_CLI_FILE, options, provider, chainId);
    }

    if (!("FORTA_CLI_NO_CACHE" in process.env)) {
      // persist any cached blocks/txs/traces to disk
      await cache.dump();
    }
  };
}

function isCorrectChainId(fortaChainId?: string, chainId?: number) {
  return fortaChainId && chainId && parseInt(fortaChainId) == chainId;
}
