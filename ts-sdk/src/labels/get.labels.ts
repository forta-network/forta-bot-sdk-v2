import { AxiosInstance } from "axios";
import { GetFortaApiHeaders, GetFortaApiUrl, assertExists } from "../utils";
import { Label } from "./label";
import { LabelSource } from "./label.source";
import { EntityType } from "./label.entity.type";

export type GetLabels = (
  query: LabelQueryOptions
) => Promise<LabelQueryResponse>;

export function provideGetLabels(
  axios: AxiosInstance,
  getFortaApiUrl: GetFortaApiUrl,
  getFortaApiHeaders: GetFortaApiHeaders
): GetLabels {
  assertExists(axios, "axios");
  assertExists(getFortaApiUrl, "getFortaApiUrl");
  assertExists(getFortaApiHeaders, "getFortaApiHeaders");

  return async function getLabels(query: LabelQueryOptions) {
    const { data }: RawGraphqlLabelResponse = await axios.post(
      getFortaApiUrl(),
      getQueryFromLabelOptions(query),
      getFortaApiHeaders()
    );

    if (data.errors?.length) throw Error(JSON.stringify(data.errors));

    const pageInfo = data.data.labels.pageInfo;
    const labels: Label[] = [];
    for (const labelData of data.data.labels.labels) {
      const { label, id, createdAt, source } = labelData;
      labels.push(
        Label.fromObject({
          ...label,
          metadata: label.metadata ?? {},
          id,
          createdAt,
          source,
        })
      );
    }
    return { labels, pageInfo };
  };
}

export interface LabelQueryOptions {
  entities?: string[];
  labels?: string[];
  sourceIds?: string[];
  entityType?: string;
  state?: boolean;
  createdSince?: number;
  createdBefore?: number;
  first?: number;
  startingCursor?: LabelCursor;
}

export interface LabelCursor {
  pageToken: string;
}

export interface LabelQueryResponse {
  labels: Label[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor?: {
      pageToken: string;
    };
  };
}

interface RawGraphqlLabelResponse {
  data: {
    data: {
      labels: {
        labels: RawGraphqlLabelData[];
        pageInfo: {
          hasNextPage: boolean;
          endCursor?: {
            pageToken: string;
          };
        };
      };
    };
    errors: any;
  };
}

interface RawGraphqlLabelData {
  id: string;
  label: RawGraphqlLabel;
  createdAt: string;
  source: LabelSource;
}

interface RawGraphqlLabel {
  confidence: number;
  entity: string;
  entityType: EntityType;
  label: string;
  metadata: any;
  remove: boolean;
}

export const getQueryFromLabelOptions = (options: LabelQueryOptions) => {
  return {
    operationName: "fetchLabels",
    query: `
            query fetchLabels(
                $entities: [String],
                $entityType: String,
                $labels: [String],
                $sourceIds: [String],
                $state: Boolean,
                $after: LabelEndCursorInput,
                $first: NonNegativeInt,
                $createdBefore: NonNegativeInt,
                $createdSince: NonNegativeInt
                ) {
                    labels(input:{
                        entities: $entities,
                        entityType: $entityType,
                        labels: $labels,
                        sourceIds: $sourceIds,
                        state: $state,
                        after: $after,
                        first: $first,
                        createdBefore: $createdBefore,
                        createdSince: $createdSince
                    }) {
                        labels {
                            createdAt
                            id
                            label {
                                confidence
                                entity
                                entityType
                                label
                                metadata
                                remove
                                uniqueKey
                            }
                            source {
                              alertHash
                              alertId
                              bot {
                                id
                                image
                                imageHash
                                manifest
                              }
                              chainId
                              id
                            }
                        }
                        pageInfo {
                            hasNextPage
                            endCursor {
                                pageToken
                            }
                        }
                    }
            }
        `,
    variables: {
      entities: options.entities,
      entityType: options.entityType,
      labels: options.labels,
      sourceIds: options.sourceIds,
      state: options.state,
      after: options.startingCursor,
      first: options.first,
      createdBefore: options.createdBefore,
      createdSince: options.createdSince,
    },
  };
};
