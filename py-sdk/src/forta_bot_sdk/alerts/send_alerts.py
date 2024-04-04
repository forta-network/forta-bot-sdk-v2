from typing import Callable, TypedDict
import json

from aiohttp import ClientSession
from ..utils import assert_exists, GetFortaApiUrl, GetFortaApiHeaders, GetAioHttpSession, Logger
from ..findings import Finding


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
        get_forta_api_headers: GetFortaApiHeaders,
        logger: Logger) -> SendAlerts:
    assert_exists(get_aiohttp_session, 'get_aiohttp_session')
    assert_exists(get_forta_api_url, 'get_forta_api_url')
    assert_exists(get_forta_api_headers, 'get_forta_api_headers')
    assert_exists(logger, 'logger')

    async def send_alerts(input: list[SendAlertsInput] | SendAlertsInput) -> list[SendAlertsResponse]:
        if not type(input) == list:
            input = [input]

        mutation = get_mutation_from_input(input)
        # dont make the http call when running in development
        if not is_prod:
            return []

        session: ClientSession = await get_aiohttp_session()
        response = await session.post(
            get_forta_api_url(),
            json=mutation,
            headers=get_forta_api_headers())

        if response.status == 200:
            send_alerts_response = (await response.json()).get('data').get('sendAlerts').get('alerts')
            # TODO check for any errors and surface them (and mark the finding for retry?)
            return [{**item, 'alert_hash': item.get('alertHash')} for item in send_alerts_response]
        else:
            logger.debug(
                f'send_alerts received non-200 response code: {response.status}')
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
        json_finding = input["finding"].to_json()
        # convert enums to all caps to match graphql enums
        json_finding["type"] = json_finding["type"].upper()
        json_finding["severity"] = json_finding["severity"].upper()
        for label in json_finding.get("labels", []):
            label["entityType"] = label["entityType"].upper()
        # remove protocol field (not part of graphql schema)
        if 'protocol' in json_finding:
            del json_finding["protocol"]
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
