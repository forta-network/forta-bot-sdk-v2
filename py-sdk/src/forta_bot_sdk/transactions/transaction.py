from typing import Optional
from ..utils import hex_to_int, get_dict_val, format_address, JSONable


class Authorization(JSONable):
    def __init__(self, dict):
        self.chain_id: int = hex_to_int(
            get_dict_val(dict, 'chainId', 'chain_id'))
        self.address: str = format_address(dict.get('address'))
        self.nonce: int = hex_to_int(dict.get('nonce'))
        self.y_parity: str = get_dict_val(dict, 'yParity', 'y_parity')
        self.r: str = dict.get('r')
        self.s: str = dict.get('s')


class Transaction(JSONable):
    def __init__(self, dict):
        self.hash: str = dict.get('hash')
        self.from_: str = format_address(dict.get('from', dict.get('from_')))
        self.to: Optional[str] = format_address(dict.get('to'))
        self.nonce: int = hex_to_int(dict.get('nonce'))
        self.gas: int = hex_to_int(dict.get('gas'))
        self.gas_price: int = hex_to_int(
            get_dict_val(dict, 'gasPrice', 'gas_price'))
        self.value: int = hex_to_int(dict.get('value'))
        self.data: str = dict.get('data', dict.get('input'))
        self.block_hash: str = get_dict_val(dict, 'blockHash', 'block_hash')
        self.block_number: int = get_dict_val(
            dict, 'blockNumber', 'block_number')
        self.type: int = hex_to_int(dict.get('type'))
        self.r: str = dict.get('r')
        self.s: str = dict.get('s')
        self.v: str = dict.get('v')
        auth_list = get_dict_val(
            dict, 'authorizationList', 'authorization_list')
        self.authorization_list: list[Authorization] = [] if auth_list is None else [
            Authorization(a) for a in auth_list]

    @property
    def input(self):
        return self.data
