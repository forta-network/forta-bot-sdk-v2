from typing import Optional
from ..utils import hex_to_int, get_dict_val, format_address, JSONable


class Transaction(JSONable):
    def __init__(self, dict):
        self.hash: str = dict.get('hash')
        self.from_: str = format_address(dict.get('from'))
        self.to: Optional[str] = format_address(dict.get('to'))
        self.nonce: int = hex_to_int(dict.get('nonce'))
        self.gas: int = hex_to_int(dict.get('gas'))
        self.gas_price: int = hex_to_int(get_dict_val(dict, 'gas_price'))
        self.value: int = hex_to_int(dict.get('value'))
        self.data: str = dict.get('data', dict.get('input'))
        self.block_hash: str = get_dict_val(dict, 'block_hash')
        self.block_number: int = get_dict_val(dict, 'block_number')
        self.r: str = dict.get('r')
        self.s: str = dict.get('s')
        self.v: str = dict.get('v')

    @property
    def input(self):
        return self.data
