from typing import Optional
from ..utils import get_dict_val, JSONable


class FindingSourceChain(JSONable):
    def __init__(self, dict):
        self.chain_id: int = get_dict_val(dict, 'chain_id')


class FindingSourceBlock(JSONable):
    def __init__(self, dict):
        self.chain_id: int = get_dict_val(dict, 'chain_id')
        self.hash: str = dict.get('hash')
        self.number: int = dict.get('number')


class FindingSourceTransaction(JSONable):
    def __init__(self, dict):
        self.chain_id: int = get_dict_val(dict, 'chain_id')
        self.hash: str = dict.get('hash')


class FindingSourceUrl(JSONable):
    def __init__(self, dict):
        self.url: str = dict.get('url')


class FindingSourceAlert(JSONable):
    def __init__(self, dict):
        self.id: str = dict.get('id')


class FindingSourceCustom(JSONable):
    def __init__(self, dict):
        self.name: str = dict.get('name')
        self.value: str = dict.get('value')


class FindingSource(JSONable):
    def __init__(self, dict):
        self.chains: Optional[list[FindingSourceChain]] = list(
            map(lambda c: FindingSourceChain(c), dict.get('chains', []) or [])) if 'chains' in dict else None
        self.blocks: Optional[list[FindingSourceBlock]] = list(
            map(lambda b: FindingSourceBlock(b), dict.get('blocks', []) or [])) if 'blocks' in dict else None
        self.transactions: Optional[list[FindingSourceTransaction]] = list(
            map(lambda t: FindingSourceTransaction(t), dict.get('transactions', []) or [])) if 'transactions' in dict else None
        self.urls: Optional[list[FindingSourceUrl]] = list(
            map(lambda u: FindingSourceUrl(u), dict.get('urls', []) or [])) if 'urls' in dict else None
        self.alerts: Optional[list[FindingSourceAlert]] = list(
            map(lambda a: FindingSourceAlert(a), dict.get('alerts', []) or [])) if 'alerts' in dict else None
        custom_sources = get_dict_val(dict, 'custom_sources')
        self.custom_sources: Optional[list[FindingSourceCustom]] = list(
            map(lambda c: FindingSourceCustom(c), custom_sources or [])) if custom_sources else None
