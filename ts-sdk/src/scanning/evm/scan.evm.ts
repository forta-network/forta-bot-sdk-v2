import { RunCliCommand } from "../../cli";
import { SendAlerts } from "../../alerts";
import { Finding } from "../../findings";
import { HandleBlock, HandleTransaction } from "../../handlers";
import { GetBotId, GetNetworkId, Sleep, assertExists } from "../../utils";
import { GetLatestBlockNumber, RunHandlersOnBlock } from "../../blocks";
import { ShouldSubmitFindings } from "../should.submit.findings";
import { GetProvider } from "./get.provider";

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
  getNetworkId: GetNetworkId,
  isRunningCliCommand: boolean,
  runCliCommand: RunCliCommand,
  getLatestBlockNumber: GetLatestBlockNumber,
  runHandlersOnBlock: RunHandlersOnBlock,
  sendAlerts: SendAlerts,
  shouldSubmitFindings: ShouldSubmitFindings,
  sleep: Sleep,
  fortaChainId: number | undefined,
  fortaShardId: number | undefined,
  fortaShardCount: number | undefined,
  shouldContinuePolling: Function = () => true
): ScanEvm {
  assertExists(getBotId, "getBotId");
  assertExists(getProvider, "getProvider");
  assertExists(getNetworkId, "getNetworkId");
  assertExists(isRunningCliCommand, "isRunningCliCommand");
  assertExists(runCliCommand, "runCliCommand");
  assertExists(getLatestBlockNumber, "getLatestBlockNumber");
  assertExists(runHandlersOnBlock, "runHandlersOnBlock");
  assertExists(sendAlerts, "sendAlerts");
  assertExists(shouldSubmitFindings, "shouldSubmitFindings");
  assertExists(sleep, "sleep");

  return async function scanEvm(options: ScanEvmOptions) {
    const { handleBlock, handleTransaction } = options;
    if (!handleBlock && !handleTransaction) {
      throw new Error("no block/transaction handler provided");
    }
    const botId = getBotId();
    let provider = await getProvider(options);
    const networkId = await getNetworkId(provider);

    // if running a CLI command, then dont start scanning
    if (isRunningCliCommand) {
      await runCliCommand({ scanEvmOptions: options, provider, networkId });
      return;
    }

    // if scanning for a specific chain and its not this one, dont do anything
    if (fortaChainId && fortaChainId != networkId) {
      return;
    }

    console.log(`listening for data on chain ${networkId}...`);
    let lastSubmissionTimestamp = Date.now(); // initialize to now
    const blockTimeSeconds = getBlockTime(networkId);
    let currentBlockNumber;
    let findings: Finding[] = [];

    // poll for latest blocks
    while (shouldContinuePolling()) {
      // getProvider checks for expired RPC JWTs (so we call it often)
      provider = await getProvider(options);
      const latestBlockNumber = await getLatestBlockNumber(provider);
      if (currentBlockNumber == undefined) {
        currentBlockNumber = latestBlockNumber;
      }

      // if no new blocks
      if (currentBlockNumber > latestBlockNumber) {
        // wait for a bit
        await sleep(blockTimeSeconds * 1000);
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
                networkId
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

// returns block time in seconds given a chain id
const getBlockTime = (chainId: number): number => {
  switch (chainId) {
    case 137: // polygon
      return 3;
    case 56: // bsc
      return 5;
    case 43114: // avalanche
      return 3;
    case 250: // fantom
      return 5;
    case 8453: // base
      return 2;
    default:
      return 15;
  }
};

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
