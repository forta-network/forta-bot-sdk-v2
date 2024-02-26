from typing import Callable, Optional, TypedDict
from .label import Label
from ..utils import GetFortaApiUrl, GetFortaApiHeaders, GetAioHttpSession, assert_exists


class GetLabelsCursor:
    def __init__(self, dict):
        self.page_token: str = dict.get('pageToken', dict.get('page_token'))


class GetLabelsResponsePageInfo:
    def __init__(self, dict):
        self.has_next_page: bool = dict.get(
            'hasNextPage', dict.get('has_next_page'))
        end_cursor = dict.get('endCursor', dict.get('end_cursor'))
        self.end_cursor: GetLabelsCursor = GetLabelsCursor(
            end_cursor) if end_cursor else None


class GetLabelsResponse:
    def __init__(self, dict):
        self.page_info: GetLabelsResponsePageInfo = GetLabelsResponsePageInfo(
            dict.get('pageInfo')) if dict.get('pageInfo') else None
        self.labels: list[Label] = []
        labels_data = dict.get('labels', [])
        for label_data in labels_data:
            label_dict = label_data.get('label')
            label_dict['id'] = label_data.get('id')
            label_dict['source'] = label_data.get('source')
            label_dict['createdAt'] = label_data.get('createdAt')
            self.labels.append(Label(label_dict))


class GetLabelsInput(TypedDict):
    entities: Optional[list[str]]
    labels: Optional[list[str]]
    source_ids: Optional[list[str]]
    chain_ids: Optional[list[int]]
    entity_type: Optional[str]
    state: Optional[bool]
    created_since: Optional[int]
    created_before: Optional[int]
    first: Optional[int]
    starting_cursor: Optional[GetLabelsCursor]


GetLabels = Callable[[GetLabelsInput], GetLabelsResponse]


def provide_get_labels(
    get_aiohttp_session: GetAioHttpSession,
    get_forta_api_url: GetFortaApiUrl,
    get_forta_api_headers: GetFortaApiHeaders
) -> GetLabels:
    assert_exists(get_aiohttp_session, 'get_aiohttp_session')
    assert_exists(get_forta_api_url, 'get_forta_api_url')
    assert_exists(get_forta_api_headers, 'get_forta_api_headers')

    async def get_labels(input: GetLabelsInput) -> GetLabelsResponse:
        session = await get_aiohttp_session()
        response = await session.post(
            get_forta_api_url(),
            json=get_query_from_input(input),
            headers=get_forta_api_headers())

        if response.status == 200:
            return GetLabelsResponse((await response.json()).get('data').get('labels'))
        else:
            raise Exception(await response.text())

    return get_labels


def get_query_from_input(input: GetLabelsInput) -> dict:
    vars = {
        'entities': input.get('entities'),
        'labels': input.get('labels'),
        'sourceIds': input.get('source_ids'),
        'chainIds': input.get('chain_ids'),
        'entityType': input.get('entity_type'),
        'state': input.get('state'),
        'createdSince': input.get('created_since'),
        'createdBefore': input.get('created_before'),
        'first': input.get('first'),
    }
    if input.get('starting_cursor'):
        vars['after'] = {
            'pageToken': input['starting_cursor'].page_token if isinstance(input['starting_cursor'], GetLabelsCursor) else input['starting_cursor'].get('page_token')
        }

    query = """
      query($input: LabelsInput) {
        labels(input: $input) {
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
      """
    return dict(query=query, variables={"input": {k: v for k, v in vars.items() if v}})
