from ..utils import format_address, get_dict_val, hex_to_int, JSONable


class Log(JSONable):
    def __init__(self, dict):
        self.address: str = format_address(dict.get('address'))
        self.topics: list[str] = dict.get('topics', [])
        self.data: str = dict.get('data')
        self.log_index: int = hex_to_int(get_dict_val(dict, 'log_index'))
        self.block_number: int = hex_to_int(get_dict_val(dict, 'block_number'))
        self.block_hash: str = get_dict_val(dict, 'block_hash')
        self.transaction_index: int = hex_to_int(
            get_dict_val(dict, 'transaction_index'))
        self.transaction_hash: str = get_dict_val(dict, 'transaction_hash')
        self.removed: bool = dict.get('removed')

    # we set these properties to enable web3.py to understand this Log class using process_log
    @property
    def logIndex(self):
        return self.log_index

    @property
    def blockNumber(self):
        return self.block_number

    @property
    def blockHash(self):
        return self.block_hash

    @property
    def transactionIndex(self):
        return self.transaction_index

    @property
    def transactionHash(self):
        return self.transaction_hash

    def __getitem__(self, key):
        return getattr(self, key)
