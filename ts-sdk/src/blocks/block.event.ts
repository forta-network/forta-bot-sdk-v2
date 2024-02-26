import { Block } from "./block";

export class BlockEvent {
  constructor(readonly chainId: number, readonly block: Block) {}

  get network() {
    return this.chainId;
  }

  get blockHash() {
    return this.block.hash;
  }

  get blockNumber() {
    return this.block.number;
  }
}
