import { asFunction } from "awilix";
import { provideCreateTransactionEvent } from "./create.transaction.event";
import { provideGetTransactionReceipt } from "./get.transaction.receipt";
import { provideRunHandlersOnTransaction } from "./run.handlers.on.transaction";

export default {
  createTransactionEvent: asFunction(provideCreateTransactionEvent),
  getTransactionReceipt: asFunction(provideGetTransactionReceipt),
  runHandlersOnTransaction: asFunction(provideRunHandlersOnTransaction),
};
