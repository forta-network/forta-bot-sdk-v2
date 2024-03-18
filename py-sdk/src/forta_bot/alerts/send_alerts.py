from typing import Callable, TypedDict
import json
from ..utils import assert_exists, snake_to_camel_case, GetFortaApiUrl, GetFortaApiHeaders, GetAioHttpSession
from ..findings import Finding, FindingType, FindingSeverity
from ..labels import EntityType


class SendAlertsInput(TypedDict):
    bot_id: str
    finding: Finding


class SendAlertError(TypedDict):
    code: str
    message: str


class SendAlertsResponse(TypedDict):
    alert_hash: str
    error: SendAlertError


SendAlerts = Callable[[list[SendAlertsInput]
                       | SendAlertsInput], SendAlertsResponse]


def provide_send_alerts(
        get_aiohttp_session: GetAioHttpSession,
        is_prod: bool,
        get_forta_api_url: GetFortaApiUrl,
        get_forta_api_headers: GetFortaApiHeaders) -> SendAlerts:
    assert_exists(get_aiohttp_session, 'get_aiohttp_session')
    assert_exists(get_forta_api_url, 'get_forta_api_url')
    assert_exists(get_forta_api_headers, 'get_forta_api_headers')

    async def send_alerts(input: list[SendAlertsInput] | SendAlertsInput) -> list[SendAlertsResponse]:
        if not type(input) == list:
            input = [input]

        mutation = get_mutation_from_input(input)
        # dont make the http call when running in development
        if not is_prod:
            return []

        session = await get_aiohttp_session()
        response = await session.post(
            get_forta_api_url(),
            json=mutation,
            headers=get_forta_api_headers())

        if response.status == 200:
            send_alerts_response = (await response.json()).get('data').get('sendAlerts').get('alerts')
            # TODO check for any errors and surface them (and mark the finding for retry?)
            return [{**item, 'alert_hash': item.get('alertHash')} for item in send_alerts_response]
        else:
            raise Exception(await response.text())

    return send_alerts


def get_mutation_from_input(inputs: list[SendAlertsInput]) -> dict:
    mutation = """
  mutation SendAlerts($alerts: [AlertRequestInput!]!) {
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
  """
    alerts = []
    # serialize the inputs list
    for input in inputs:
        # serialize finding to json
        json_finding = json.loads(repr(input["finding"]))
        # convert enums to all caps to match graphql enums
        json_finding["type"] = json_finding["type"].upper()
        json_finding["severity"] = json_finding["severity"].upper()
        for label in json_finding.get("labels", []):
            label["entity_type"] = label["entity_type"].upper()
        # remove protocol field (not part of graphql schema)
        if 'protocol' in json_finding:
            del json_finding["protocol"]
        # remove any empty-value fields and convert snake-case keys to camel-case
        json_finding = {snake_to_camel_case(
            k): v for k, v in json_finding.items() if v}
        for index, label in enumerate(json_finding.get("labels", [])):
            json_finding["labels"][index] = {snake_to_camel_case(
                k): v for k, v in label.items() if v}
        alerts.append({
            "botId": input["bot_id"],
            "finding": json_finding
        })

    return {
        'query': mutation,
        'variables': {
            'alerts': alerts
        }
    }
