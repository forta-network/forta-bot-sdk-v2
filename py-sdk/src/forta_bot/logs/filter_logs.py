import json
from web3.datastructures import AttributeDict
from hexbytes import HexBytes
from typing import Callable, Optional
from eth_abi.abi import ABICodec
from web3._utils.abi import build_strict_registry
from web3._utils.events import get_event_data
# from web3.exceptions import LogTopicError, MismatchedABI
from web3.types import ABIEvent
from ..utils import assert_exists, Logger
from .log import Log

# see web3 docs for returned attributes https://web3py.readthedocs.io/en/v6.13.0/web3.contract.html#web3.contract.ContractEvents.myEvent
FilterLogs = Callable[[list[Log], str |
                       list[str], Optional[str | list[str]]], AttributeDict]


def provide_filter_logs() -> FilterLogs:

    # codec for decoding the topics
    codec = ABICodec(build_strict_registry())

    def filter_logs(logs: list[Log], abi: str | list[str], contract_address: str | list[str]):
        abi = abi if isinstance(abi, list) else [abi]
        abi = [json.loads(abi_item) for abi_item in abi]
        abi = [ABIEvent(abi_item)
               for abi_item in abi if abi_item['type'] == 'event']
        # filter logs by contract address, if provided
        if (contract_address):
            contract_address = contract_address if isinstance(
                contract_address, list) else [contract_address]
            contract_address_map = {
                address.lower(): True for address in contract_address}
            logs = filter(lambda log: log.address.lower()
                          in contract_address_map, logs)
        # parse logs
        results = []
        for log in logs:
            log.topics = [HexBytes(topic) for topic in log.topics]
            for abi_item in abi:
                try:
                    results.append(get_event_data(codec, abi_item, log))
                except Exception as e:
                    continue  # TODO see if theres a better way to handle 'no matching event' error
        return results
        # abi = abi if isinstance(abi, list) else [abi]
        # abi = [json.loads(abi_item) for abi_item in abi]
        # # filter logs by contract address, if provided
        # if (contract_address):
        #     contract_address = contract_address if isinstance(
        #         contract_address, list) else [contract_address]
        #     contract_address_map = {
        #         address.lower(): True for address in contract_address}
        #     logs = filter(lambda log: log.address.lower()
        #                   in contract_address_map, logs)
        # # determine which event names to filter
        # event_names = []
        # for abi_item in abi:
        #     if abi_item['type'] == "event":
        #         event_names.append(abi_item['name'])
        # # parse logs
        # results = []
        # contract = Web3().eth.contract(
        #     "0x0000000000000000000000000000000000000000", abi=abi)
        # for log in logs:
        #     log.topics = [HexBytes(topic) for topic in log.topics]
        #     for event_name in event_names:
        #         try:
        #             results.append(
        #                 contract.events[event_name]().process_log(log))
        #         except Exception as e:
        #             continue  # TODO see if theres a better way to handle 'no matching event' error
        # return results

    return filter_logs
