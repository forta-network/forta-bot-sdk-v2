import { ethers } from "ethers";
import awilixConfigureContainer from "./di";
import {
  CreateTransactionEvent,
  GetTransactionReceipt,
  JsonRpcTransaction,
  Receipt,
  Transaction,
  TransactionEvent,
  TxEventBlock,
} from "./transactions";
import {
  Initialize,
  HandleTransaction,
  HandleBlock,
  HandleAlert,
  HealthCheck,
  InitializeResponse,
} from "./handlers";
import {
  Finding,
  FindingSeverity,
  FindingType,
  isPrivateFindings,
  setPrivateFindings,
} from "./findings";
import {
  BloomFilter,
  FortaConfig,
  GetBotId,
  GetBotOwner,
  GetFortaChainId,
  GetFortaConfig,
  GetJsonFile,
  assertExists,
  assertIsNonEmptyString,
  keccak256,
} from "./utils";
import {
  Alert,
  AlertCursor,
  AlertEvent,
  AlertQueryOptions,
  AlertQueryResponse,
  AlertSubscription,
  CreateAlertEvent,
  GetAlerts,
  SendAlerts,
  SendAlertsInput,
  SendAlertsResponse,
} from "./alerts";
import {
  DecodeJwt,
  GetRpcJwt,
  GetScannerJwt,
  MOCK_JWT,
  VerifyJwt,
} from "./jwt";
import { FilterLogs, JsonRpcLog, Log, LogDescription } from "./logs";
import { ScanAlerts, ScanEvm } from "./scanning";
import { RunHealthCheck } from "./health";
import { Block, BlockEvent, CreateBlockEvent, JsonRpcBlock } from "./blocks";
import { GetProvider } from "./scanning/evm/get.provider";
import {
  EntityType,
  GetLabels,
  Label,
  LabelCursor,
  LabelQueryOptions,
  LabelQueryResponse,
} from "./labels";
import { Trace, TraceAction, TraceResult } from "./traces";

interface DiContainer {
  resolve<T>(key: string): T;
}
type ConfigureContainer = (args?: object) => DiContainer;
const configureContainer: ConfigureContainer = (args: object = {}) => {
  return awilixConfigureContainer();
};

// provide a way to create as many scanEvm as needed
const createScanEvm = () => {
  return container.resolve<ScanEvm>("scanEvm");
};

// all exported DI resolutions should happen here to prevent circular dependencies
const container = awilixConfigureContainer();
const isProd = container.resolve<boolean>("isProd");
const isProduction = isProd;
const scanEthereum = container.resolve<ScanEvm>("scanEvm");
const scanPolygon = container.resolve<ScanEvm>("scanEvm");
const scanBsc = container.resolve<ScanEvm>("scanEvm");
const scanAvalanche = container.resolve<ScanEvm>("scanEvm");
const scanArbitrum = container.resolve<ScanEvm>("scanEvm");
const scanOptimism = container.resolve<ScanEvm>("scanEvm");
const scanFantom = container.resolve<ScanEvm>("scanEvm");
const scanBase = container.resolve<ScanEvm>("scanEvm");
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
const getChainId = container.resolve<GetFortaChainId>("getFortaChainId");
const getProvider = container.resolve<GetProvider>("getProvider");
const runHealthCheck = container.resolve<RunHealthCheck>("runHealthCheck");
const createTransactionEvent = container.resolve<CreateTransactionEvent>(
  "createTransactionEvent"
);
const createBlockEvent =
  container.resolve<CreateBlockEvent>("createBlockEvent");
const createAlertEvent =
  container.resolve<CreateAlertEvent>("createAlertEvent");
const getTransactionReceipt = container.resolve<GetTransactionReceipt>(
  "getTransactionReceipt"
);
const getBotOwner = container.resolve<GetBotOwner>("getBotOwner");
const getLabels = container.resolve<GetLabels>("getLabels");

export {
  ethers,
  isProd,
  isProduction,
  configureContainer,
  createScanEvm,
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
  Label,
  EntityType,
  TxEventBlock,
  Alert,
  Block,
  Transaction,
  Receipt,
  Log,
  LogDescription,
  Trace,
  TraceAction,
  TraceResult,
  GetAlerts,
  AlertQueryOptions,
  AlertQueryResponse,
  AlertCursor,
  SendAlerts,
  SendAlertsInput,
  SendAlertsResponse,
  GetLabels,
  LabelQueryOptions,
  LabelQueryResponse,
  LabelCursor,
  InitializeResponse,
  AlertSubscription,
  BloomFilter,
  JsonRpcTransaction,
  JsonRpcBlock,
  JsonRpcLog,
  MOCK_JWT,
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
  createTransactionEvent,
  createBlockEvent,
  createAlertEvent,
  setPrivateFindings,
  isPrivateFindings,
  getTransactionReceipt,
  getLabels,
  getBotOwner,
};
