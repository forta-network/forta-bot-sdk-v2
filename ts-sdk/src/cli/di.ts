import { asFunction } from "awilix";
import { provideRunFile } from "./run.file";
import { provideRunAlert } from "./run.alert";
import { provideRunBlock } from "./run.block";
import { provideRunBlockRange } from "./run.block.range";
import { provideRunCliCommand } from "./run.cli.command";
import { provideRunSequence } from "./run.sequence";
import { provideRunTransaction } from "./run.transaction";

export default {
  runCliCommand: asFunction(provideRunCliCommand),
  runTransaction: asFunction(provideRunTransaction),
  runBlock: asFunction(provideRunBlock),
  runAlert: asFunction(provideRunAlert),
  runSequence: asFunction(provideRunSequence),
  runBlockRange: asFunction(provideRunBlockRange),
  runFile: asFunction(provideRunFile),
};
