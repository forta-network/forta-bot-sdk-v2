from typing import Optional
from ..utils import hex_to_int, format_address, get_dict_val, JSONable


class Trace(JSONable):
    def __init__(self, dict):
        self.action: TraceAction = TraceAction(dict.get('action', {}))
        self.block_hash: str = get_dict_val(dict, 'block_hash')
        self.block_number: int = get_dict_val(dict, 'block_number')
        has_result = type(dict.get('result')) == dict
        self.result: Optional[TraceResult] = TraceResult(
            dict.get('result')) if has_result else None
        self.subtraces: int = dict.get('subtraces')
        self.trace_address: list[int] = get_dict_val(
            dict, 'trace_address') or []
        self.transaction_hash: str = get_dict_val(dict, 'transaction_hash')
        self.transaction_position: int = get_dict_val(
            dict, 'transaction_position')
        self.type: str = dict.get('type')
        self.error: str = dict.get('error')


class TraceAction(JSONable):
    def __init__(self, dict):
        self.call_type: str = get_dict_val(dict, 'call_type')
        self.to: str = format_address(dict.get('to'))
        self.input: str = dict.get('input')
        self.from_: str = format_address(dict.get('from'))
        self.value: int = hex_to_int(dict.get('value'))
        self.init: str = dict.get('init')
        self.address: str = format_address(dict.get('address'))
        self.balance: str = dict.get('balance')
        self.refund_address: str = format_address(
            get_dict_val(dict, 'refund_address'))


class TraceResult(JSONable):
    def __init__(self, dict):
        self.gas_used: int = hex_to_int(get_dict_val(dict, 'gas_used'))
        self.address: str = dict.get('address')
        self.code: str = dict.get('code')
        self.output: str = dict.get('output')
