from typing import Optional
import json
from ..utils import BloomFilter, JSONEncoder
from ..labels import Label


class Alert:
    def __init__(self, dict: dict):
        self.addresses: list[str] = dict.get('addresses')
        self.alert_id: str = dict.get('alert_id', dict.get('alertId'))
        self.contracts: list[AlertContract] = list(
            map(lambda c: AlertContract(c), dict.get('contracts', []) or []))
        self.created_at: str = dict.get('created_at', dict.get('createdAt'))
        self.description: str = dict.get('description')
        self.finding_type: str = dict.get(
            'finding_type', dict.get('findingType'))
        self.name: str = dict.get('name')
        self.hash: str = dict.get('hash')
        self.protocol: str = dict.get('protocol')
        self.severity: str = dict.get('severity')
        self.source: AlertSource = AlertSource(dict.get('source'))
        self.metadata: dict[str, str] = dict.get('metadata')
        self.projects: Optional[list[AlertProject]] = list(
            map(lambda p: AlertProject(p), dict.get('projects', []) or []))
        self.scan_node_count: int = dict.get(
            'scan_node_count', dict.get('scanNodeCount'))
        self.alert_document_type: str = dict.get(
            'alert_document_type', dict.get('alertDocumentType'))
        self.related_alerts: Optional[list[str]] = dict.get(
            'related_alerts', dict.get('relatedAlerts'))
        self.chain_id: int = dict.get('chain_id', dict.get('chainId'))
        self.labels: list[Label] = list(
            map(lambda l: Label(l), dict.get('labels', [])))
        address_filter = dict.get(
            'address_bloom_filter', dict.get('addressBloomFilter'))
        self.address_filter: Optional[BloomFilter] = BloomFilter(
            address_filter) if address_filter is not None else None

    def has_address(self, address: str) -> bool:
        if self.address_filter is not None:
            return self.address_filter.has(address)
        elif self.addresses is not None:
            return address in self.addresses
        return False

    def repr_json(self) -> dict:
        return {k: v for k, v in self.__dict__.items() if v}

    def __repr__(self) -> str:
        return json.dumps(self.repr_json(), indent=4, cls=JSONEncoder)


class AlertSource:
    def __init__(self, dict):
        self.transaction_hash: Optional[str] = dict.get(
            'transaction_hash', dict.get('transactionHash'))
        self.block: Optional[AlertSourceBlock] = AlertSourceBlock(dict.get('block')) if dict.get(
            'block') is not None else None
        self.bot: Optional[AlertSourceBot] = AlertSourceBot(dict.get('bot')) if dict.get(
            'bot') is not None else None
        source_alert = dict.get('source_alert', dict.get('sourceAlert'))
        self.source_alert: Optional[AlertSourceAlert] = AlertSourceAlert(
            source_alert) if source_alert is not None else None

    def repr_json(self) -> dict:
        return {k: v for k, v in self.__dict__.items() if v}


class AlertSourceBlock:
    def __init__(self, dict):
        self.timestamp: str = dict.get('timestamp')
        self.chain_id: int = dict.get('chain_id', dict.get('chainId'))
        self.hash: str = dict.get('hash')
        self.number: int = dict.get('number')

    def repr_json(self) -> dict:
        return {k: v for k, v in self.__dict__.items() if v}


class AlertSourceBot:
    def __init__(self, dict):
        self.id: str = dict.get('id')
        self.reference: str = dict.get('reference')
        self.image: str = dict.get('image')

    def repr_json(self) -> dict:
        return {k: v for k, v in self.__dict__.items() if v}


class AlertSourceAlert:
    def __init__(self, dict):
        self.hash: str = dict.get('hash')
        self.bot_id: str = dict.get('bot_id', dict.get('botId'))
        self.timestamp: str = dict.get('timestamp')
        self.chain_id: int = dict.get('chain_id', dict.get('chainId'))

    def repr_json(self) -> dict:
        return {k: v for k, v in self.__dict__.items() if v}


class AlertContract:
    def __init__(self, dict):
        self.address: str = dict.get('address')
        self.name: str = dict.get('name')
        self.project_id: str = dict.get('project_id', dict.get('projectId'))

    def repr_json(self):
        return {k: v for k, v in self.__dict__.items() if v}


class AlertProject:
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

    def repr_json(self) -> dict:
        return {k: v for k, v in self.__dict__.items() if v}


class AlertProjectContact:
    def __init__(self, dict):
        self.security_email_address: str = dict.get(
            'security_email_address', dict.ge('securityEmailAddress'))
        self.general_email_address: str = dict.get(
            'general_email_address', dict.get('generalEmailAddress'))

    def repr_json(self) -> dict:
        return {k: v for k, v in self.__dict__.items() if v}


class AlertProjectToken:
    def __init__(self, dict):
        self.symbol: str = dict.get('symbol')
        self.name: str = dict.get('name')
        self.decimals: int = dict.get('decimals')
        self.chain_id: int = dict.get('chain_id', dict.get('chainId'))
        self.address: str = dict.get('address')

    def repr_json(self) -> dict:
        return {k: v for k, v in self.__dict__.items() if v}


class AlertProjectSocial:
    def __init__(self, dict):
        self.twitter: str = dict.get('twitter')
        self.github: str = dict.get('github')
        self.everest: str = dict.get('everest')
        self.coingecko: str = dict.get('coingecko')

    def repr_json(self) -> dict:
        return {k: v for k, v in self.__dict__.items() if v}
