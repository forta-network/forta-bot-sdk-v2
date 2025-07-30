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
        self.effective_gas_price: int = hex_to_int(get_dict_val(
            dict, 'effectiveGasPrice', 'effective_gas_price'))
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
        self.blob_gas_used: int = hex_to_int(
            get_dict_val(dict, 'blobGasUsed', 'blob_gas_used'))
        self.blob_gas_price: int = hex_to_int(
            get_dict_val(dict, 'blobGasPrice', 'blob_gas_price'))
        # L2 specific fields
        self.l1_base_fee_scalar: int = hex_to_int(
            get_dict_val(dict, 'l1BaseFeeScalar', 'l1_base_fee_scalar'))
        self.l1_blob_base_fee: int = hex_to_int(
            get_dict_val(dict, 'l1BlobBaseFee', 'l1_blob_base_fee'))
        self.l1_blob_base_fee_scalar: int = hex_to_int(get_dict_val(
            dict, 'l1BlobBaseFeeScalar', 'l1_blob_base_fee_scalar'))
        self.l1_fee: int = hex_to_int(get_dict_val(dict, 'l1Fee', 'l1_fee'))
        self.l1_gas_price: int = hex_to_int(
            get_dict_val(dict, 'l1GasPrice', 'l1_gas_price'))
        self.l1_gas_used: int = hex_to_int(
            get_dict_val(dict, 'l1GasUsed', 'l1_gas_used'))
