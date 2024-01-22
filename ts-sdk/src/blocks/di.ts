import { asFunction } from "awilix";
import { provideCreateBlockEvent } from "./create.block.event";
import { provideGetBlockWithTransactions } from "./get.block.with.transactions";
import { provideGetLatestBlockNumber } from "./get.latest.block.number";
import { provideRunHandlersOnBlock } from "./run.handlers.on.block";

export default {
  createBlockEvent: asFunction(provideCreateBlockEvent),
  getBlockWithTransactions: asFunction(provideGetBlockWithTransactions),
  getLatestBlockNumber: asFunction(provideGetLatestBlockNumber),
  runHandlersOnBlock: asFunction(provideRunHandlersOnBlock),
};
