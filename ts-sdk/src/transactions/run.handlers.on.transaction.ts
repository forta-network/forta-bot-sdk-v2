import { JsonRpcProvider } from "ethers";
import { Finding } from "../findings";
import { CreateTransactionEvent } from "../transactions";
import { GetBlockWithTransactions } from "../blocks";
import { Logger, assertExists, assertFindings } from "../utils";
import { ScanEvmOptions } from "../scanning";
import { GetTraceData } from "../traces";
import { GetTransactionReceipt } from "./get.transaction.receipt";

export type RunHandlersOnTransaction = (
  txHash: string,
  options: ScanEvmOptions,
  provider: JsonRpcProvider,
  chainId: number
) => Promise<Finding[]>;

export function provideRunHandlersOnTransaction(
  getTransactionReceipt: GetTransactionReceipt,
  getBlockWithTransactions: GetBlockWithTransactions,
  getTraceData: GetTraceData,
  createTransactionEvent: CreateTransactionEvent,
  logger: Logger
): RunHandlersOnTransaction {
  assertExists(getTransactionReceipt, "getTransactionReceipt");
  assertExists(getBlockWithTransactions, "getBlockWithTransactions");
  assertExists(getTraceData, "getTraceData");
  assertExists(createTransactionEvent, "createTransactionEvent");
  assertExists(logger, "logger");

  return async function runHandlersOnTransaction(
    txHash: string,
    options: ScanEvmOptions,
    provider: JsonRpcProvider,
    chainId: number
  ) {
    const { handleTransaction, useTraceData } = options;
    if (!handleTransaction) {
      throw new Error("no transaction handler provided");
    }

    const [receipt, traces] = await Promise.all([
      getTransactionReceipt(txHash, provider, chainId),
      useTraceData
        ? getTraceData(txHash, provider, chainId)
        : Promise.resolve([]),
    ]);

    if (!receipt) {
      logger.error(
        `no transaction found for hash ${txHash} on chain ${chainId}`
      );
      return [];
    }

    const block = await getBlockWithTransactions(
      chainId,
      parseInt(receipt.blockNumber),
      provider
    );

    txHash = txHash.toLowerCase();
    const transaction = block.transactions.find(
      (tx) => tx.hash.toLowerCase() === txHash
    )!;
    const txEvent = createTransactionEvent(
      transaction,
      block,
      chainId,
      traces,
      receipt.logs
    );
    const findings = await handleTransaction(txEvent, provider);

    assertFindings(findings);

    logger.log(
      `${findings.length} findings for transaction ${txHash} on chain ${chainId} ${findings}`
    );

    return findings;
  };
}
