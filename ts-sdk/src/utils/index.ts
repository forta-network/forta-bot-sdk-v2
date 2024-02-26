import { Keccak } from "sha3";
import { formatAddress, isZeroAddress } from "./address";
import {
  assertExists,
  assertIsNonEmptyString,
  assertIsFromEnum,
  assertFindings,
  assertIsStringKeyAndStringValueMap,
} from "./assert";
import { BloomFilter } from "./bloom.filter";
import { FortaConfig, GetFortaConfig } from "./get.forta.config";
import { GetJsonFile } from "./get.json.file";
import { Sleep } from "./sleep";
import { WithRetry } from "./with.retry";
import { GetFortaApiHeaders } from "./get.forta.api.headers";
import { GetFortaApiUrl } from "./get.forta.api.url";
import { GetBotId } from "./get.bot.id";
import { GetFortaChainId } from "./get.forta.chain.id";
import { GetChainId } from "./get.chain.id";
import { GetBotOwner } from "./get.bot.owner";
import { Logger } from "./logger";

const keccak256 = (str: string) => {
  const hash = new Keccak(256);
  hash.update(str);
  return `0x${hash.digest("hex")}`;
};

export {
  BloomFilter,
  WithRetry,
  Sleep,
  GetJsonFile,
  GetFortaConfig,
  FortaConfig,
  GetFortaApiHeaders,
  GetFortaApiUrl,
  GetBotId,
  GetFortaChainId,
  GetChainId,
  GetBotOwner,
  Logger,
  formatAddress,
  isZeroAddress,
  assertExists,
  assertIsNonEmptyString,
  assertIsFromEnum,
  assertFindings,
  assertIsStringKeyAndStringValueMap,
  keccak256,
};
