import { RunCliCommand } from "../../cli";
import { SendAlerts } from "../../alerts";
import { Finding } from "../../findings";
import { HandleBlock, HandleTransaction } from "../../handlers";
import { GetBotId, GetChainId, Logger, Sleep, assertExists } from "../../utils";
import { GetLatestBlockNumber, RunHandlersOnBlock } from "../../blocks";
import { ShouldSubmitFindings } from "../should.submit.findings";
import { GetProvider } from "./get.provider";
import { GetBlockTime } from "./get.block.time";

export type ScanEvm = (options: ScanEvmOptions) => Promise<void>;

export interface ScanEvmOptions {
  rpcUrl: string;
  rpcKeyId?: string;
  rpcJwtClaims?: { [key: string]: string };
  rpcHeaders?: { [key: string]: string };
  localRpcUrl?: string;
  useTraceData?: boolean;
  handleBlock?: HandleBlock;
  handleTransaction?: HandleTransaction;
}

export function provideScanEvm(
  getBotId: GetBotId,
  getProvider: GetProvider,
  getChainId: GetChainId,
  isRunningCliCommand: boolean,
  runCliCommand: RunCliCommand,
  getBlockTime: GetBlockTime,
  getLatestBlockNumber: GetLatestBlockNumber,
  runHandlersOnBlock: RunHandlersOnBlock,
  sendAlerts: SendAlerts,
  shouldSubmitFindings: ShouldSubmitFindings,
  sleep: Sleep,
  isProd: boolean,
  fortaChainId: number | undefined,
  fortaShardId: number | undefined,
  fortaShardCount: number | undefined,
  shouldContinuePolling: Function = () => true,
  logger: Logger
): ScanEvm {
  assertExists(getBotId, "getBotId");
  assertExists(getProvider, "getProvider");
  assertExists(getChainId, "getChainId");
  assertExists(isRunningCliCommand, "isRunningCliCommand");
  assertExists(runCliCommand, "runCliCommand");
  assertExists(getBlockTime, "getBlockTime");
  assertExists(getLatestBlockNumber, "getLatestBlockNumber");
  assertExists(runHandlersOnBlock, "runHandlersOnBlock");
  assertExists(sendAlerts, "sendAlerts");
  assertExists(shouldSubmitFindings, "shouldSubmitFindings");
  assertExists(sleep, "sleep");
  assertExists(logger, "logger");

  return async function scanEvm(options: ScanEvmOptions) {
    const { handleBlock, handleTransaction } = options;
    if (!handleBlock && !handleTransaction) {
      throw new Error("no block/transaction handler provided");
    }
    const botId = getBotId();
    let provider = await getProvider(options);
    const chainId = await getChainId(provider);

    // if running a CLI command, then dont start scanning
    if (isRunningCliCommand) {
      await runCliCommand({
        scanEvmOptions: options,
        provider,
        chainId,
      });
      return;
    }

    // if scanning for a specific chain and its not this one, dont do anything
    if (fortaChainId && fortaChainId != chainId) {
      return;
    }

    logger.info(`listening for data on chain ${chainId}...`);
    let lastSubmissionTimestamp = Date.now(); // initialize to now
    // when running in production, poll every 10 seconds (to match the json-rpc cache)
    const pollingIntervalSeconds = isProd ? 10 : getBlockTime(chainId);
    let currentBlockNumber;
    let findings: Finding[] = [];

    // poll for latest blocks
    while (shouldContinuePolling()) {
      // getProvider checks for expired RPC JWTs (so we call it often)
      provider = await getProvider(options);
      const latestBlockNumber = await getLatestBlockNumber(chainId, provider);
      if (currentBlockNumber == undefined) {
        currentBlockNumber = latestBlockNumber;
      }

      // if no new blocks
      if (currentBlockNumber > latestBlockNumber) {
        // wait for a bit
        await sleep(pollingIntervalSeconds * 1000);
      } else {
        // process new blocks
        while (currentBlockNumber <= latestBlockNumber) {
          // check if this block should be processed
          if (
            isBlockOnThisShard(
              currentBlockNumber,
              fortaShardId,
              fortaShardCount
            )
          ) {
            // process block
            findings = findings.concat(
              await runHandlersOnBlock(
                currentBlockNumber,
                options,
                provider,
                chainId
              )
            );
          }
          currentBlockNumber++;
        }
      }

      // check if should submit any findings
      if (shouldSubmitFindings(findings, lastSubmissionTimestamp)) {
        await sendAlerts(findings.map((finding) => ({ botId, finding })));
        findings = []; // clear array
        lastSubmissionTimestamp = Date.now(); // remember timestamp
      }
    }
  };
}

const isBlockOnThisShard = (
  blockNumber: number,
  shardId?: number,
  shardCount?: number
): boolean => {
  // if bot is not sharded
  if (shardId === undefined || shardCount === undefined) {
    return true; // process everything
  }

  // process block if blockNumber modulo shardCount equals shardId
  return blockNumber % shardCount === shardId;
};
