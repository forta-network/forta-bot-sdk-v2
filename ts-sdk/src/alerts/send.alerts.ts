import { AxiosInstance } from "axios";
import { Finding, isPrivateFindings } from "../findings";
import { GetFortaApiHeaders, GetFortaApiUrl, assertExists } from "../utils";
import { EntityType } from "../labels";

export type SendAlerts = (
  input: SendAlertsInput[] | SendAlertsInput
) => Promise<SendAlertsResponse[]>;

export function provideSendAlerts(
  axios: AxiosInstance,
  isProd: boolean,
  getFortaApiUrl: GetFortaApiUrl,
  getFortaApiHeaders: GetFortaApiHeaders
): SendAlerts {
  assertExists(axios, "axios");
  assertExists(getFortaApiUrl, "getFortaApiUrl");
  assertExists(getFortaApiHeaders, "getFortaApiHeaders");

  return async function sendAlerts(input: SendAlertsInput[] | SendAlertsInput) {
    if (!Array.isArray(input)) {
      input = [input];
    }

    const mutation = getMutationFromInput(input);
    // dont make the http call when running in development
    if (!isProd) {
      return [];
    }

    const response: RawGraphqlSendAlertsResponse = await axios.post(
      getFortaApiUrl(),
      mutation,
      getFortaApiHeaders()
    );

    if (response.data && response.data.errors)
      throw Error(JSON.stringify(response.data.errors));

    // TODO check for any partial errors and surface them (maybe mark the finding for retry?)
    return response.data.data.sendAlerts.alerts;
  };
}

export interface SendAlertsInput {
  botId: string;
  finding: Finding;
}

export interface RawGraphqlSendAlertsResponse {
  data: {
    data: {
      sendAlerts: {
        alerts: SendAlertsResponse[];
      };
    };
    errors: any;
  };
}

export interface SendAlertsResponse {
  alertHash?: string;
  error?: SendAlertError;
}

export interface SendAlertError {
  code: string;
  message: string;
}

const getMutationFromInput = (inputs: SendAlertsInput[]) => {
  return {
    query: `
      mutation SendAlerts(
        $alerts: [AlertRequestInput!]!
      ) {
        sendAlerts(alerts: $alerts) {
          alerts {
            alertHash
            error {
              code
              message
            }
          }
        }
      }
    `,
    variables: {
      alerts: inputs.map((input) => {
        const jsonFinding = JSON.parse(input.finding.toString());
        // convert enums to all caps to match graphql enums
        jsonFinding.type = jsonFinding.type.toUpperCase();
        jsonFinding.severity = jsonFinding.severity.toUpperCase();
        for (const label of jsonFinding.labels) {
          // TODO investigate why sometimes the entityType is an integer enum (instead of string)
          if (typeof label.entityType == "number") {
            label.entityType = EntityType[label.entityType];
          }
          label.entityType = label.entityType.toUpperCase();
        }
        // remove protocol field (not part of graphql schema)
        delete jsonFinding["protocol"];
        // remove any empty-value fields
        for (const key of Object.keys(jsonFinding)) {
          if (isEmptyValue(jsonFinding[key])) {
            delete jsonFinding[key];
          } else if (key === "labels") {
            // if there are labels, remove empty-value fields from them too
            for (const label of jsonFinding.labels) {
              for (const labelKey of Object.keys(label)) {
                if (isEmptyValue(label[labelKey])) {
                  delete label[labelKey];
                }
              }
            }
          }
        }
        // set private flag
        jsonFinding.private = isPrivateFindings();

        return {
          botId: input.botId,
          finding: jsonFinding,
        };
      }),
    },
  };
};

function isEmptyValue(val: any): boolean {
  if (val == null || val == undefined) return true;
  if (Array.isArray(val)) return val.length == 0;
  if (typeof val === "string") return val.length == 0;
  if (typeof val === "object") return Object.keys(val).length == 0;
  return false;
}
