from typing import Optional
from ..utils import hex_to_int, format_address, get_dict_val, JSONable


class Trace(JSONable):
    def __init__(self, d):
        self.action: TraceAction = TraceAction(d.get('action', {}))
        self.block_hash: str = get_dict_val(d, 'blockHash', 'block_hash')
        self.block_number: int = get_dict_val(d, 'blockNumber', 'block_number')
        has_result = type(d.get('result')) == dict
        self.result: Optional[TraceResult] = TraceResult(
            d.get('result')) if has_result else None
        self.subtraces: int = d.get('subtraces')
        self.trace_address: list[int] = get_dict_val(
            d, 'traceAddress', 'trace_address') or []
        self.transaction_hash: str = get_dict_val(
            d, 'transactionHash', 'transaction_hash')
        self.transaction_position: int = get_dict_val(
            d, 'transactionPosition', 'transaction_position')
        self.type: str = d.get('type')
        self.error: str = d.get('error')


class TraceAction(JSONable):
    def __init__(self, dict):
        self.call_type: str = get_dict_val(dict, 'callType', 'call_type')
        self.to: str = format_address(dict.get('to'))
        self.input: str = dict.get('input')
        self.from_: str = format_address(get_dict_val(dict, 'from', 'from_'))
        self.value: int = hex_to_int(dict.get('value')) or 0
        self.init: str = dict.get('init')
        self.address: str = format_address(dict.get('address'))
        self.balance: str = dict.get('balance')
        self.refund_address: str = format_address(
            get_dict_val(dict, 'refundAddress', 'refund_address'))


class TraceResult(JSONable):
    def __init__(self, dict):
        self.gas_used: int = hex_to_int(
            get_dict_val(dict, 'gasUsed', 'gas_used'))
        self.address: str = dict.get('address')
        self.code: str = dict.get('code')
        self.output: str = dict.get('output')
