from typing import Optional
from ..utils import hex_to_int, get_dict_val, JSONable
from ..logs import Log


class Receipt(JSONable):
    def __init__(self, dict):
        self.status: bool = dict.get('status')
        self.root: str = dict.get('root')
        self.gas_used: int = hex_to_int(
            get_dict_val(dict, 'gasUsed', 'gas_used'))
        self.cumulative_gas_used: int = hex_to_int(
            get_dict_val(dict, 'cumulativeGasUsed', 'cumulative_gas_used'))
        self.logs_bloom: str = get_dict_val(dict, 'logsBloom', 'logs_bloom')
        self.logs: list[Log] = [Log(l) for l in dict.get('logs', [])]
        self.contract_address: Optional[str] = get_dict_val(
            dict, 'contractAddress', 'contract_address')
        self.block_number: int = hex_to_int(
            get_dict_val(dict, 'blockNumber', 'block_number'))
        self.block_hash: str = get_dict_val(dict, 'blockHash', 'block_hash')
        self.transaction_index: int = hex_to_int(
            get_dict_val(dict, 'transactionIndex', 'transaction_index'))
        self.transaction_hash: str = get_dict_val(
            dict, 'transactionHash', 'transaction_hash')
