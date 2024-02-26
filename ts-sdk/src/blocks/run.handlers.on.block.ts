import { JsonRpcProvider } from "ethers";
import { Finding } from "../findings";
import { Logger, assertExists, assertFindings } from "../utils";
import { CreateTransactionEvent } from "../transactions";
import { ScanEvmOptions } from "../scanning";
import { GetLogsForBlock, JsonRpcLog } from "../logs";
import { GetTraceData, Trace } from "../traces";
import { MetricsHelper } from "../metrics";
import { CreateBlockEvent } from "./create.block.event";
import { GetBlockWithTransactions } from "./get.block.with.transactions";

export type RunHandlersOnBlock = (
  blockHashOrNumber: string | number,
  options: ScanEvmOptions,
  provider: JsonRpcProvider,
  chainId: number
) => Promise<Finding[]>;

export function provideRunHandlersOnBlock(
  getBlockWithTransactions: GetBlockWithTransactions,
  getTraceData: GetTraceData,
  getLogsForBlock: GetLogsForBlock,
  createBlockEvent: CreateBlockEvent,
  createTransactionEvent: CreateTransactionEvent,
  metricsHelper: MetricsHelper,
  shouldStopOnErrors: boolean,
  logger: Logger
): RunHandlersOnBlock {
  assertExists(getBlockWithTransactions, "getBlockWithTransactions");
  assertExists(getTraceData, "getTraceData");
  assertExists(getLogsForBlock, "getLogsForBlock");
  assertExists(createBlockEvent, "createBlockEvent");
  assertExists(createTransactionEvent, "createTransactionEvent");
  assertExists(metricsHelper, "metricsHelper");
  assertExists(logger, "logger");

  return async function runHandlersOnBlock(
    blockHashOrNumber: string | number,
    options: ScanEvmOptions,
    provider: JsonRpcProvider,
    chainId: number
  ) {
    const { handleBlock, handleTransaction, useTraceData } = options;
    if (!handleBlock && !handleTransaction) {
      throw new Error("no block/transaction handler provided");
    }

    logger.log(`fetching block ${blockHashOrNumber} on chain ${chainId}...`);
    const blockQueryStart = metricsHelper.startBlockQueryTimer(
      chainId,
      blockHashOrNumber
    );
    const block = await getBlockWithTransactions(
      blockHashOrNumber,
      provider,
      chainId
    );
    if (!block) {
      logger.error(
        `no block found for hash/number ${blockHashOrNumber} on chain ${chainId}`
      );
      return [];
    }

    let blockFindings: Finding[] = [];
    // run block handler
    if (handleBlock) {
      try {
        const blockEvent = createBlockEvent(block, chainId);
        metricsHelper.startHandleBlockTimer(
          chainId,
          blockHashOrNumber,
          blockEvent.block.timestamp
        );
        blockFindings = await handleBlock(blockEvent, provider);
        metricsHelper.endHandleBlockTimer(chainId, blockHashOrNumber);

        assertFindings(blockFindings);
        logger.log(
          `${blockFindings.length} findings for block ${block.hash} on chain ${chainId} ${blockFindings}`
        );
        metricsHelper.reportHandleBlockSuccess(chainId, blockFindings.length);
      } catch (e) {
        metricsHelper.reportHandleBlockError(chainId);
        if (shouldStopOnErrors) {
          throw e;
        }
        logger.error(
          `${new Date().toISOString()}    handleBlock ${block.hash}`
        );
        logger.error(e);
      }
    }

    if (!handleTransaction) return blockFindings;

    let txFindings: Finding[] = [];
    const blockNumber = parseInt(block.number);
    const [logs, traces] = await Promise.all([
      getLogsForBlock(blockNumber, provider, chainId),
      useTraceData === true
        ? getTraceData(blockNumber, provider, chainId)
        : Promise.resolve([]),
    ]);

    // build map of logs for each transaction using block logs
    const logMap: { [txHash: string]: JsonRpcLog[] } = {};
    logs.forEach((log) => {
      if (!log.transactionHash) return;
      const txHash = log.transactionHash.toLowerCase();
      if (!logMap[txHash]) logMap[txHash] = [];
      logMap[txHash].push(log);
    });

    // build map of traces for each transaction using block traces
    const traceMap: { [txHash: string]: Trace[] } = {};
    traces.forEach((trace) => {
      if (!trace.transactionHash) return;
      const txHash = trace.transactionHash.toLowerCase();
      if (!traceMap[txHash]) traceMap[txHash] = [];
      traceMap[txHash].push(trace);
    });

    // run transaction handler on all block transactions
    const blockTimestamp = parseInt(block.timestamp);
    for (const transaction of block.transactions) {
      const txHash = transaction.hash.toLowerCase();
      try {
        const txEvent = createTransactionEvent(
          transaction,
          block,
          chainId,
          traceMap[txHash],
          logMap[txHash]
        );
        metricsHelper.startHandleTransactionTimer(
          chainId,
          txHash,
          blockQueryStart,
          blockTimestamp
        );
        const findings = await handleTransaction(txEvent, provider);
        metricsHelper.endHandleTransactionTimer(chainId, txHash);

        assertFindings(findings);
        logger.log(
          `${findings.length} findings for transaction ${transaction.hash} on chain ${chainId} ${findings}`
        );
        txFindings.push(...findings);
        metricsHelper.reportHandleTransactionSuccess(chainId, findings.length);
      } catch (e) {
        metricsHelper.reportHandleTransactionError(chainId);
        if (shouldStopOnErrors) {
          throw e;
        }
        logger.error(
          `${new Date().toISOString()}    handleTransaction ${txHash}`
        );
        logger.error(e);
      }
    }

    return blockFindings.concat(txFindings);
  };
}
