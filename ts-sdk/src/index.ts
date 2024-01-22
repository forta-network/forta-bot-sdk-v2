import { ethers } from "ethers";
import awilixConfigureContainer from "./di";
import { TransactionEvent } from "./transactions";
import {
  Initialize,
  HandleTransaction,
  HandleBlock,
  HandleAlert,
  HealthCheck,
} from "./handlers";
import { Finding, FindingSeverity, FindingType } from "./findings";
import {
  FortaConfig,
  GetBotId,
  GetChainId,
  GetFortaConfig,
  GetJsonFile,
  assertExists,
  assertIsNonEmptyString,
  keccak256,
} from "./utils";
import { AlertEvent, GetAlerts, SendAlerts } from "./alerts";
import { DecodeJwt, GetRpcJwt, GetScannerJwt, VerifyJwt } from "./jwt";
import { FilterLogs } from "./logs";
import { ScanAlerts, ScanEvm } from "./scanning";
import { RunHealthCheck } from "./health";
import { BlockEvent } from "./blocks";
import { GetProvider } from "./scanning/evm/get.provider";

interface DiContainer {
  resolve<T>(key: string): T;
}
type ConfigureContainer = (args?: object) => DiContainer;
const configureContainer: ConfigureContainer = (args: object = {}) => {
  return awilixConfigureContainer();
};

// all exported DI resolutions should happen here to prevent circular dependencies
const container = awilixConfigureContainer();
const isProd = container.resolve<boolean>("isProd");
const isProduction = isProd;
const scanEvm = container.resolve<ScanEvm>("scanEvm");
const scanEthereum = scanEvm;
const scanPolygon = scanEvm;
const scanBsc = scanEvm;
const scanAvalanche = scanEvm;
const scanArbitrum = scanEvm;
const scanOptimism = scanEvm;
const scanFantom = scanEvm;
const scanBase = scanEvm;
const scanAlerts = container.resolve<ScanAlerts>("scanAlerts");
const getFortaConfig = container.resolve<GetFortaConfig>("getFortaConfig");
const getAlerts = container.resolve<GetAlerts>("getAlerts");
const sendAlerts = container.resolve<SendAlerts>("sendAlerts");
const getScannerJwt = container.resolve<GetScannerJwt>("getScannerJwt");
const fetchJwt = getScannerJwt;
const getRpcJwt = container.resolve<GetRpcJwt>("getRpcJwt");
const verifyJwt = container.resolve<VerifyJwt>("verifyJwt");
const decodeJwt = container.resolve<DecodeJwt>("decodeJwt");
const filterLogs = container.resolve<FilterLogs>("filterLogs");
const filterLog = filterLogs;
const getBotId = container.resolve<GetBotId>("getBotId");
const getChainId = container.resolve<GetChainId>("getChainId");
const getProvider = container.resolve<GetProvider>("getProvider");
const runHealthCheck = container.resolve<RunHealthCheck>("runHealthCheck");

export {
  ethers,
  isProd,
  isProduction,
  configureContainer,
  scanEvm,
  scanEthereum,
  scanPolygon,
  scanBsc,
  scanAvalanche,
  scanArbitrum,
  scanOptimism,
  scanFantom,
  scanBase,
  scanAlerts,
  ScanEvm,
  ScanAlerts,
  AlertEvent,
  Initialize,
  HandleTransaction,
  HandleBlock,
  HandleAlert,
  BlockEvent,
  TransactionEvent,
  HealthCheck,
  Finding,
  FindingSeverity,
  FindingType,
  FortaConfig,
  GetJsonFile,
  getScannerJwt,
  fetchJwt,
  getRpcJwt,
  verifyJwt,
  decodeJwt,
  filterLogs,
  filterLog, //for backwards compatibility
  assertExists,
  assertIsNonEmptyString,
  keccak256,
  getFortaConfig,
  getBotId,
  getChainId,
  getAlerts,
  sendAlerts,
  runHealthCheck,
  getProvider,
};
