from typing import Optional
from ..utils import BloomFilter, JSONable, get_dict_val
from ..labels import Label


class Alert(JSONable):
    def __init__(self, dict: dict):
        self.addresses: list[str] = dict.get('addresses')
        self.alert_id: str = get_dict_val(dict, 'alert_id')
        self.contracts: list[AlertContract] = list(
            map(lambda c: AlertContract(c), dict.get('contracts', []) or []))
        self.created_at: str = get_dict_val(dict, 'created_at')
        self.description: str = dict.get('description')
        self.finding_type: str = get_dict_val(dict, 'finding_type')
        self.name: str = dict.get('name')
        self.hash: str = dict.get('hash')
        self.protocol: str = dict.get('protocol')
        self.severity: str = dict.get('severity')
        self.source: AlertSource = AlertSource(
            dict.get('source')) if dict.get('source') is not None else None
        self.metadata: dict[str, str] = dict.get('metadata')
        self.projects: Optional[list[AlertProject]] = list(
            map(lambda p: AlertProject(p), dict.get('projects', []) or []))
        self.scan_node_count: int = get_dict_val(dict, 'scan_node_count')
        self.alert_document_type: str = get_dict_val(
            dict, 'alert_document_type')
        self.related_alerts: Optional[list[str]
                                      ] = get_dict_val(dict, 'related_alerts')
        self.chain_id: int = get_dict_val(dict, 'chain_id')
        self.labels: list[Label] = list(
            map(lambda l: Label(l), dict.get('labels', [])))
        address_filter = get_dict_val(dict, 'address_bloom_filter')
        self.address_filter: Optional[BloomFilter] = BloomFilter(
            address_filter) if address_filter is not None else None

    def has_address(self, address: str) -> bool:
        if self.address_filter is not None:
            return self.address_filter.has(address)
        elif self.addresses is not None:
            return address in self.addresses
        return False


class AlertSource(JSONable):
    def __init__(self, dict):
        self.transaction_hash: Optional[str] = get_dict_val(
            dict, 'transaction_hash')
        self.block: Optional[AlertSourceBlock] = AlertSourceBlock(dict.get('block')) if dict.get(
            'block') is not None else None
        self.bot: Optional[AlertSourceBot] = AlertSourceBot(dict.get('bot')) if dict.get(
            'bot') is not None else None
        source_alert = get_dict_val(dict, 'source_alert')
        self.source_alert: Optional[AlertSourceAlert] = AlertSourceAlert(
            source_alert) if source_alert is not None else None


class AlertSourceBlock(JSONable):
    def __init__(self, dict):
        self.timestamp: str = dict.get('timestamp')
        self.chain_id: int = get_dict_val(dict, 'chain_id')
        self.hash: str = dict.get('hash')
        self.number: int = dict.get('number')


class AlertSourceBot(JSONable):
    def __init__(self, dict):
        self.id: str = dict.get('id')
        self.reference: str = dict.get('reference')
        self.image: str = dict.get('image')


class AlertSourceAlert(JSONable):
    def __init__(self, dict):
        self.hash: str = dict.get('hash')
        self.bot_id: str = get_dict_val(dict, 'bot_id')
        self.timestamp: str = dict.get('timestamp')
        self.chain_id: int = get_dict_val(dict, 'chain_id')


class AlertContract(JSONable):
    def __init__(self, dict):
        self.address: str = dict.get('address')
        self.name: str = dict.get('name')
        self.project_id: str = get_dict_val(dict, 'project_id')


class AlertProject(JSONable):
    def __init__(self, dict):
        self.id: str = dict.get('id')
        self.name: str = dict.get('name')
        self.contacts: Optional[list[AlertProjectContact]] = AlertProjectContact(dict.get('contacts')) if dict.get(
            'contacts') is not None else None
        self.website: str = dict.get('website')
        self.token: Optional[AlertProjectToken] = AlertProjectToken(dict.get('token')) if dict.get(
            'token') is not None else None
        self.social: Optional[AlertProjectSocial] = AlertProjectSocial(dict.get('social')) if dict.get(
            'social') is not None else None


class AlertProjectContact(JSONable):
    def __init__(self, dict):
        self.security_email_address: str = get_dict_val(
            dict, 'security_email_address')
        self.general_email_address: str = get_dict_val(
            dict, 'general_email_address')


class AlertProjectToken(JSONable):
    def __init__(self, dict):
        self.symbol: str = dict.get('symbol')
        self.name: str = dict.get('name')
        self.decimals: int = dict.get('decimals')
        self.chain_id: int = get_dict_val(dict, 'chain_id')
        self.address: str = dict.get('address')


class AlertProjectSocial(JSONable):
    def __init__(self, dict):
        self.twitter: str = dict.get('twitter')
        self.github: str = dict.get('github')
        self.everest: str = dict.get('everest')
        self.coingecko: str = dict.get('coingecko')
