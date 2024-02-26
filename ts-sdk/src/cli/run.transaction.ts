import { JsonRpcProvider } from "ethers";
import { assertExists } from "../utils";
import { ScanEvmOptions } from "../scanning";
import { RunHandlersOnTransaction } from "../transactions";

// runs transaction handlers against a specified transaction or transactions
export type RunTransaction = (
  txHash: string,
  options: ScanEvmOptions,
  provider: JsonRpcProvider,
  chainId: number
) => Promise<void>;

export function provideRunTransaction(
  runHandlersOnTransaction: RunHandlersOnTransaction
): RunTransaction {
  assertExists(runHandlersOnTransaction, "runHandlersOnTransaction");

  return async function runTransaction(
    txHash: string,
    options: ScanEvmOptions,
    provider: JsonRpcProvider,
    chainId: number
  ) {
    let hashes = [txHash];
    // support for specifying multiple transactions with comma-delimited list
    if (txHash.includes(",")) {
      hashes = txHash.split(",");
    }

    for (const hash of hashes) {
      await runHandlersOnTransaction(hash, options, provider, chainId);
    }
  };
}
