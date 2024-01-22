import { JsonRpcProvider } from "ethers";
import { Finding } from "../findings";
import { assertExists, assertFindings } from "../utils";
import { CreateTransactionEvent } from "../transactions";
import { ScanEvmOptions } from "../scanning";
import { GetLogsForBlock, JsonRpcLog } from "../logs";
import { GetTraceData, Trace } from "../traces";
import { CreateBlockEvent } from "./create.block.event";
import { GetBlockWithTransactions } from "./get.block.with.transactions";

export type RunHandlersOnBlock = (
  blockHashOrNumber: string | number,
  options: ScanEvmOptions,
  provider: JsonRpcProvider,
  networkId: number
) => Promise<Finding[]>;

export function provideRunHandlersOnBlock(
  getBlockWithTransactions: GetBlockWithTransactions,
  getTraceData: GetTraceData,
  getLogsForBlock: GetLogsForBlock,
  createBlockEvent: CreateBlockEvent,
  createTransactionEvent: CreateTransactionEvent,
  shouldStopOnErrors: boolean
): RunHandlersOnBlock {
  assertExists(getBlockWithTransactions, "getBlockWithTransactions");
  assertExists(getTraceData, "getTraceData");
  assertExists(getLogsForBlock, "getLogsForBlock");
  assertExists(createBlockEvent, "createBlockEvent");
  assertExists(createTransactionEvent, "createTransactionEvent");

  return async function runHandlersOnBlock(
    blockHashOrNumber: string | number,
    options: ScanEvmOptions,
    provider: JsonRpcProvider,
    networkId: number
  ) {
    const { handleBlock, handleTransaction, useTraceData } = options;
    if (!handleBlock && !handleTransaction) {
      throw new Error("no block/transaction handler provided");
    }

    console.log(`fetching block ${blockHashOrNumber} on chain ${networkId}...`);
    const block = await getBlockWithTransactions(
      blockHashOrNumber,
      provider,
      networkId
    );
    if (!block) {
      console.log(
        `no block found for hash/number ${blockHashOrNumber} on chain ${networkId}`
      );
      return [];
    }

    let blockFindings: Finding[] = [];
    // run block handler
    if (handleBlock) {
      try {
        const blockEvent = createBlockEvent(block, networkId);
        blockFindings = await handleBlock(blockEvent, provider);

        assertFindings(blockFindings);
        console.log(
          `${blockFindings.length} findings for block ${block.hash} on chain ${networkId} ${blockFindings}`
        );
      } catch (e) {
        if (shouldStopOnErrors) {
          throw e;
        }
        console.log(`${new Date().toISOString()}    handleBlock ${block.hash}`);
        console.log(e);
      }
    }

    if (!handleTransaction) return blockFindings;

    let txFindings: Finding[] = [];
    const blockNumber = parseInt(block.number);
    const [logs, traces] = await Promise.all([
      getLogsForBlock(blockNumber, provider, networkId),
      useTraceData === true
        ? getTraceData(blockNumber, provider, networkId)
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
    for (const transaction of block.transactions) {
      const txHash = transaction.hash.toLowerCase();
      try {
        const txEvent = createTransactionEvent(
          transaction,
          block,
          networkId,
          traceMap[txHash],
          logMap[txHash]
        );
        const findings = await handleTransaction(txEvent, provider);
        txFindings.push(...findings);

        assertFindings(findings);
        console.log(
          `${findings.length} findings for transaction ${transaction.hash} on chain ${networkId} ${findings}`
        );
      } catch (e) {
        if (shouldStopOnErrors) {
          throw e;
        }
        console.log(
          `${new Date().toISOString()}    handleTransaction ${txHash}`
        );
        console.log(e);
      }
    }

    return blockFindings.concat(txFindings);
  };
}
