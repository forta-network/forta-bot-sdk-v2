import json
from datetime import datetime
from web3.datastructures import AttributeDict
from hexbytes import HexBytes
from typing import Callable, Optional
from eth_abi.abi import ABICodec
from web3._utils.abi import build_strict_registry
from web3._utils.events import get_event_data
# from web3.exceptions import LogTopicError, MismatchedABI
from web3.types import ABIEvent
from ..utils import keccak256, Logger
from .log import Log

# see web3 docs for returned attributes https://web3py.readthedocs.io/en/v6.13.0/web3.contract.html#web3.contract.ContractEvents.myEvent
FilterLogs = Callable[[list[Log], str |
                       list[str], Optional[str | list[str]]], AttributeDict]


def provide_filter_logs() -> FilterLogs:

    # codec for decoding the topics
    codec = ABICodec(build_strict_registry())
    # cache any abi for performance
    abi_cache = {}
    logger = Logger(True, True)

    def filter_logs(logs: list[Log], abi: str | list[str], contract_address: str | list[str]):
        # start = datetime.now().timestamp()
        abi = abi if isinstance(abi, list) else [abi]
        abi_hash = keccak256(''.join(abi))
        if abi_hash in abi_cache:
            abi = abi_cache[abi_hash]
        else:
            abi = [json.loads(abi_item) for abi_item in abi]
            abi = [ABIEvent(abi_item)
                   for abi_item in abi if abi_item['type'] == 'event']
            abi_cache[abi_hash] = abi
        # logger.debug(
        #     f'filter_logs:load_abi took {datetime.now().timestamp()-start}')
        # filter logs by contract address, if provided
        if (contract_address):
            contract_address = contract_address if isinstance(
                contract_address, list) else [contract_address]
            contract_address_map = {
                address.lower(): True for address in contract_address}
            logs = filter(lambda log: log.address.lower()
                          in contract_address_map, logs)
        # logger.debug(
        #     f'filter_logs:filter_address took {datetime.now().timestamp()-start}')
        # parse logs
        results = []
        for log in logs:
            log_start = datetime.now().timestamp()
            log.topics = [HexBytes(topic) for topic in log.topics]
            for abi_item in abi:
                try:
                    results.append(get_event_data(codec, abi_item, log))
                except Exception as e:
                    continue  # TODO see if theres a better way to handle 'no matching event' error
            # logger.debug(
            #     f'filter_logs:process_log took {datetime.now().timestamp()-log_start}')
        # logger.debug(f'filter_logs took {datetime.now().timestamp()-start}')
        return results

    return filter_logs
