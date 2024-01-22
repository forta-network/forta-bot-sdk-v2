import { AxiosInstance } from "axios";
import { Finding, isPrivateFindings } from "../findings";
import { GetFortaApiHeaders, GetFortaApiUrl, assertExists } from "../utils";

export type SendAlerts = (
  input: SendAlertsInput[] | SendAlertsInput
) => Promise<SendAlertsResponse[]>;

export function provideSendAlerts(
  axios: AxiosInstance,
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

    const response: RawGraphqlSendAlertsResponse = await axios.post(
      getFortaApiUrl(),
      getMutationFromInput(input),
      getFortaApiHeaders()
    );

    if (response.data && response.data.errors)
      throw Error(JSON.stringify(response.data.errors));

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
        const finding = JSON.parse(input.finding.toString());
        // convert enums to all caps to match graphql enums
        finding.type = finding.type.toUpperCase();
        finding.severity = finding.severity.toUpperCase();
        for (const label of finding.labels) {
          label.entityType = label.entityType.toUpperCase();
        }
        // remove protocol field (not part of graphql schema)
        delete finding["protocol"];
        // remove any empty fields
        for (const key of Object.keys(finding)) {
          if (isEmptyValue(finding[key])) {
            delete finding[key];
          } else if (key === "labels") {
            // if there are labels, remove empty fields from them too
            for (const label of finding.labels) {
              for (const labelKey of Object.keys(label)) {
                if (isEmptyValue(label[labelKey])) {
                  delete label[labelKey];
                }
              }
            }
          }
        }
        // set private flag
        finding.private = isPrivateFindings();

        return {
          botId: input.botId,
          finding,
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
