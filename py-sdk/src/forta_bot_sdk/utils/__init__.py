from typing import Any, Optional
from web3 import Web3
from .assertions import assert_is_non_empty_string, assert_is_from_enum, assert_exists, assert_is_string_key_to_string_value_map, assert_findings
from .get_bot_id import GetBotId, provide_get_bot_id
from .get_forta_chain_id import GetFortaChainId, provide_get_forta_chain_id
from .get_bot_owner import GetBotOwner, provide_get_bot_owner
from .get_forta_config import GetFortaConfig, FortaConfig, provide_get_forta_config
from .file_system import FileSystem
from .get_json_file import provide_get_json_file
from .sleep import Sleep
from .get_forta_api_url import GetFortaApiUrl, provide_get_forta_api_url
from .get_forta_api_headers import GetFortaApiHeaders, provide_get_forta_api_headers
from .bloom_filter import BloomFilter
from .sleep import Sleep, provide_sleep
from .get_aiohttp_session import provide_get_aiohttp_session, GetAioHttpSession
from .get_chain_id import provide_get_chain_id, GetChainId
from .with_retry import provide_with_retry, WithRetry, RetryOptions
from .address import format_address, is_zero_address, get_create_address
from .logger import Logger
from .json_encoder import JSONEncoder, JSONable
from .now import now
from .snake_to_camel_case import snake_to_camel_case
from .format_exception import format_exception


def hex_to_int(val: str | int) -> Optional[int]:
    if val is None:
        return None
    if type(val) == int:
        return val
    return int(val, 0)


def get_dict_val(d: dict, key: str) -> Optional[Any]:
    if key in d:
        return d[key]
    return d.get(snake_to_camel_case(key))


def keccak256(val: str) -> str:
    return Web3.keccak(text=val).hex()
