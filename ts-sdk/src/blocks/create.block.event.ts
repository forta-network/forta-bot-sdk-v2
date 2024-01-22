import { formatAddress } from "../utils";
import { JsonRpcBlock } from "./block";
import { BlockEvent } from "./block.event";

// creates a Forta BlockEvent from a json-rpc block object
export type CreateBlockEvent = (
  block: JsonRpcBlock,
  networkId: number
) => BlockEvent;

export function provideCreateBlockEvent(): CreateBlockEvent {
  return function createBlockEvent(block: JsonRpcBlock, networkId: number) {
    const blok = {
      difficulty: block.difficulty,
      extraData: block.extraData,
      gasLimit: block.gasLimit,
      gasUsed: block.gasUsed,
      hash: block.hash,
      logsBloom: block.logsBloom,
      miner: formatAddress(block.miner),
      mixHash: block.mixHash,
      nonce: block.nonce,
      number: parseInt(block.number),
      parentHash: block.parentHash,
      receiptsRoot: block.receiptsRoot,
      sha3Uncles: block.sha3Uncles,
      size: block.size,
      stateRoot: block.stateRoot,
      timestamp: parseInt(block.timestamp),
      totalDifficulty: block.totalDifficulty,
      transactions: block.transactions.map((tx) => tx.hash),
      transactionsRoot: block.transactionsRoot,
      uncles: block.uncles,
    };
    return new BlockEvent(networkId, blok);
  };
}
