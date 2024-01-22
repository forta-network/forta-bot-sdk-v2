import { JsonRpcProvider } from "ethers";
import { Finding } from "../findings";
import { CreateTransactionEvent } from "../transactions";
import { GetBlockWithTransactions } from "../blocks";
import { assertExists, assertFindings } from "../utils";
import { ScanEvmOptions } from "../scanning";
import { GetTraceData } from "../traces";
import { GetTransactionReceipt } from "./get.transaction.receipt";

export type RunHandlersOnTransaction = (
  txHash: string,
  options: ScanEvmOptions,
  provider: JsonRpcProvider,
  networkId: number
) => Promise<Finding[]>;

export function provideRunHandlersOnTransaction(
  getTransactionReceipt: GetTransactionReceipt,
  getBlockWithTransactions: GetBlockWithTransactions,
  getTraceData: GetTraceData,
  createTransactionEvent: CreateTransactionEvent
): RunHandlersOnTransaction {
  assertExists(getTransactionReceipt, "getTransactionReceipt");
  assertExists(getBlockWithTransactions, "getBlockWithTransactions");
  assertExists(getTraceData, "getTraceData");
  assertExists(createTransactionEvent, "createTransactionEvent");

  return async function runHandlersOnTransaction(
    txHash: string,
    options: ScanEvmOptions,
    provider: JsonRpcProvider,
    networkId: number
  ) {
    const { handleTransaction, useTraceData } = options;
    if (!handleTransaction) {
      throw new Error("no transaction handler provided");
    }

    const [receipt, traces] = await Promise.all([
      getTransactionReceipt(txHash, provider, networkId),
      useTraceData
        ? getTraceData(txHash, provider, networkId)
        : Promise.resolve([]),
    ]);

    if (!receipt) {
      console.log(
        `no transaction found for hash ${txHash} on chain ${networkId}`
      );
      return [];
    }

    const block = await getBlockWithTransactions(
      parseInt(receipt.blockNumber),
      provider,
      networkId
    );

    txHash = txHash.toLowerCase();
    const transaction = block.transactions.find(
      (tx) => tx.hash.toLowerCase() === txHash
    )!;
    const txEvent = createTransactionEvent(
      transaction,
      block,
      networkId,
      traces,
      receipt.logs
    );
    const findings = await handleTransaction(txEvent, provider);

    assertFindings(findings);

    console.log(
      `${findings.length} findings for transaction ${txHash} on chain ${networkId} ${findings}`
    );

    return findings;
  };
}
