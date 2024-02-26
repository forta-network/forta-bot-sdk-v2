import { JsonRpcProvider } from "ethers";
import { assertExists } from "../utils";
import { ScanEvmOptions } from "../scanning";
import { RunHandlersOnBlock } from "../blocks";

// runs handlers against specified block number range
export type RunBlockRange = (
  blockRange: string,
  options: ScanEvmOptions,
  provider: JsonRpcProvider,
  chainId: number
) => Promise<void>;

export function provideRunBlockRange(
  runHandlersOnBlock: RunHandlersOnBlock
): RunBlockRange {
  assertExists(runHandlersOnBlock, "runHandlersOnBlock");

  return async function runBlockRange(
    blockRange: string,
    options: ScanEvmOptions,
    provider: JsonRpcProvider,
    chainId: number
  ) {
    const [startBlock, endBlock] = blockRange.split("..");
    const startBlockNumber = parseInt(startBlock);
    const endBlockNumber = parseInt(endBlock);
    if (endBlockNumber <= startBlockNumber) {
      throw new Error("end block must be greater than start block");
    }

    for (
      let blockNumber = startBlockNumber;
      blockNumber <= endBlockNumber;
      blockNumber++
    ) {
      await runHandlersOnBlock(blockNumber, options, provider, chainId);
    }
  };
}
