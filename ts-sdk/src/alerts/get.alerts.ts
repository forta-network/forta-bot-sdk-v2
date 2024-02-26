import { AxiosInstance } from "axios";
import { Alert } from "./alert";
import { GetFortaApiUrl, GetFortaApiHeaders, assertExists } from "../utils";

export type GetAlerts = (
  query: AlertQueryOptions
) => Promise<AlertQueryResponse>;

export function provideGetAlerts(
  axios: AxiosInstance,
  getFortaApiUrl: GetFortaApiUrl,
  getFortaApiHeaders: GetFortaApiHeaders
): GetAlerts {
  assertExists(axios, "axios");
  assertExists(getFortaApiUrl, "getFortaApiUrl");
  assertExists(getFortaApiHeaders, "getFortaApiHeaders");

  return async function getAlerts(query: AlertQueryOptions) {
    const { data }: RawGraphqlAlertResponse = await axios.post(
      getFortaApiUrl(),
      getQueryFromAlertOptions(query),
      getFortaApiHeaders()
    );

    if (data.errors?.length) throw Error(JSON.stringify(data.errors));

    const pageInfo = data.data.alerts.pageInfo;
    const alerts: Alert[] = [];
    for (const alertData of data.data.alerts.alerts) {
      alerts.push(Alert.fromObject(alertData));
    }
    return { alerts, pageInfo };
  };
}

export interface AlertQueryOptions {
  botIds?: string[]; // filter results by bot ids
  addresses?: string[]; // filter results based on addresses involved in alerts
  alertHash?: string;
  alertName?: string;
  alertId?: string;
  alertIds?: string[];
  chainId?: number;
  createdSince?: number;
  createdBefore?: number;
  first?: number; // indicates max number of results,
  startingCursor?: AlertCursor; // query results after the specified cursor
  projectId?: string;
  scanNodeConfirmations?: {
    // filter results by number of scan nodes confirming the alert
    gte: number;
    lte: number;
  };
  severities?: string[]; // filter results by severity levels,
  transactionHash?: string;
  blockSortDirection?: "desc" | "asc"; // set sorting order by block number
  blockDateRange?: {
    startDate: Date;
    endDate: Date;
  };
  blockNumberRange?: {
    startBlockNumber: number;
    endBlockNumber: number;
  };
}

export interface AlertQueryResponse {
  alerts: Alert[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor?: {
      alertId: string;
      blockNumber: number;
    };
  };
}

export interface AlertCursor {
  alertId: string;
  blockNumber: number;
}

interface RawGraphqlAlertResponse {
  data: {
    data: {
      alerts: AlertQueryResponse;
    };
    errors: any;
  };
}

const getQueryFromAlertOptions = (options: AlertQueryOptions) => {
  return {
    operationName: "fetchAlerts",
    query: `
            query fetchAlerts(
                $bots: [String], 
                $addresses: [String], 
                $after: AlertEndCursorInput,
                $alertHash: String, 
                $alertName: String, 
                $alertId: String, 
                $alertIds: [String], 
                $chainId: NonNegativeInt,
                $first: NonNegativeInt,
                $projectId: String,
                $scanNodeConfirmations: scanNodeFilters,
                $severities: [String],
                $transactionHash: String,
                $blockSortDirection: Sort,
                $createdSince: NonNegativeInt,
                $createdBefore: NonNegativeInt,
                $blockDateRange: DateRange,
                $blockNumberRange: BlockRange
                ) {
                    alerts(input:{
                        bots: $bots,
                        addresses: $addresses,
                        after: $after,
                        alertHash: $alertHash,
                        alertName: $alertName,
                        alertId: $alertId,
                        alertIds: $alertIds,
                        chainId: $chainId,
                        projectId: $projectId,
                        scanNodeConfirmations: $scanNodeConfirmations,
                        severities: $severities,
                        transactionHash: $transactionHash,
                        blockSortDirection: $blockSortDirection,
                        first: $first,
                        createdSince: $createdSince,
                        createdBefore: $createdBefore,
                        blockDateRange: $blockDateRange,
                        blockNumberRange: $blockNumberRange
                    }) {
                        alerts {
                            alertId
                            addresses
                            contracts {
                                address
                                name
                                projectId
                            }
                            createdAt
                            description
                            hash
                            metadata
                            name
                            projects {
                                id
                            }
                            protocol
                            scanNodeCount
                            severity
                            source {
                                transactionHash
                                bot {
                                    chainIds
                                    createdAt
                                    description
                                    developer
                                    docReference
                                    enabled
                                    id
                                    image
                                    name
                                    reference
                                    repository
                                    projects
                                    scanNodes
                                    version
                                }
                                block {
                                    number
                                    hash
                                    timestamp
                                    chainId
                                }
                                sourceAlert {
                                    hash
                                    botId
                                    timestamp
                                    chainId
                                }
                            }
                            alertDocumentType
                            findingType
                            relatedAlerts
                            chainId
                            labels {
                                label
                                confidence
                                entity
                                entityType
                                remove
                                metadata
                                uniqueKey
                            }
                            addressBloomFilter {
                                bitset
                                k
                                m
                            }
                        }
                        pageInfo {
                            hasNextPage
                            endCursor {
                                alertId
                                blockNumber
                            }
                        }
                    }
            }
        `,
    variables: {
      bots: options.botIds,
      addresses: options.addresses,
      after: options.startingCursor,
      alertId: options.alertId,
      chainId: options.chainId,
      first: options.first,
      projectId: options.projectId,
      scanNodeConfirmations: options.scanNodeConfirmations,
      severities: options.severities,
      transactionHash: options.transactionHash,
      blockSortDirection: options.blockSortDirection,
      createdSince: options.createdSince,
      createdBefore: options.createdBefore,
      blockDateRange: options.blockDateRange
        ? {
            startDate: options.blockDateRange.startDate
              .toISOString()
              .split("T")[0],
            endDate: options.blockDateRange.endDate.toISOString().split("T")[0],
          }
        : undefined,
      blockNumberRange: options.blockNumberRange,
      alertIds: options.alertIds,
      alertHash: options.alertHash,
      alertName: options.alertName,
    },
  };
};
