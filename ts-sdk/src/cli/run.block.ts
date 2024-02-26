import { JsonRpcProvider } from "ethers";
import { ScanEvmOptions } from "../scanning";
import { assertExists } from "../utils";
import { RunHandlersOnBlock } from "../blocks";

// runs handlers against specified block number/hash or multiple blocks
export type RunBlock = (
  blockNumberOrHash: string,
  options: ScanEvmOptions,
  provider: JsonRpcProvider,
  chainId: number
) => Promise<void>;

export function provideRunBlock(
  runHandlersOnBlock: RunHandlersOnBlock
): RunBlock {
  assertExists(runHandlersOnBlock, "runHandlersOnBlock");

  return async function runBlock(
    blockNumberOrHash: string,
    options: ScanEvmOptions,
    provider: JsonRpcProvider,
    chainId: number
  ) {
    let blocks = [blockNumberOrHash];
    // support for specifying multiple blocks with comma-delimited list
    if (blockNumberOrHash.includes(",")) {
      blocks = blockNumberOrHash.split(",");
    }

    for (const block of blocks) {
      await runHandlersOnBlock(block, options, provider, chainId);
    }
  };
}
