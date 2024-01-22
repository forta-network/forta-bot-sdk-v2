import { Block } from "./block";

export class BlockEvent {
  constructor(readonly network: number, readonly block: Block) {}

  get blockHash() {
    return this.block.hash;
  }

  get blockNumber() {
    return this.block.number;
  }
}
