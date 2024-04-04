from ..utils import format_address, hex_to_int, get_dict_val, JSONable
from ..transactions import Transaction


class Block(JSONable):
    def __init__(self, dict):
        self.difficulty: int = hex_to_int(dict.get('difficulty'))
        self.extra_data: str = get_dict_val(dict, 'extra_data')
        self.gas_limit: int = hex_to_int(get_dict_val(dict, 'gas_limit'))
        self.gas_used: int = hex_to_int(get_dict_val(dict, 'gas_used'))
        self.hash: str = dict.get('hash')
        self.logs_bloom: str = get_dict_val(dict, 'logs_bloom')
        self.miner: str = format_address(dict.get('miner'))
        self.mix_hash: str = get_dict_val(dict, 'mix_hash')
        self.nonce: str = dict.get('nonce')
        self.number: int = hex_to_int(dict.get('number'))
        self.parent_hash: str = get_dict_val(dict, 'parent_hash')
        self.receipts_root: str = get_dict_val(dict, 'receipts_root')
        self.sha3_uncles: str = get_dict_val(dict, 'sha3_uncles')
        self.size: int = hex_to_int(dict.get('size'))
        self.state_root: str = get_dict_val(dict, 'state_root')
        self.timestamp: int = hex_to_int(dict.get('timestamp'))
        self.total_difficulty: int = hex_to_int(
            get_dict_val(dict, 'total_difficulty'))
        self.transactions_root: str = get_dict_val(dict, 'transactions_root')
        self.uncles: list[str] = dict.get('uncles')
        self.transactions: list[Transaction] = [
            Transaction(t) if not isinstance(t, Transaction) else t for t in dict.get('transactions')] if 'transactions' in dict else []
