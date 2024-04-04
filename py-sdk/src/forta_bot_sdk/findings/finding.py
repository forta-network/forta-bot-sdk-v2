import time
from datetime import datetime
from typing import Optional, TypedDict
from ..utils import assert_is_non_empty_string, assert_is_from_enum, assert_is_string_key_to_string_value_map, JSONable
from ..labels import Label
from .finding_severity import FindingSeverity
from .finding_type import FindingType
from .finding_source import FindingSource


class FindingInput(TypedDict):
    name: str
    description: str
    alert_id: str
    severity: FindingSeverity
    type: FindingType
    protocol: Optional[str]
    metadata: Optional[dict]
    addresses: Optional[list[str]]
    labels: Optional[list[Label]]
    unique_key: Optional[str]
    source: Optional[FindingSource]
    timestamp: datetime


class Finding(JSONable):
    def __init__(self, dict: FindingInput):
        self.name: str = assert_is_non_empty_string(dict.get('name'), 'name')
        self.description: str = assert_is_non_empty_string(
            dict.get('description'), 'description')
        self.alert_id: str = assert_is_non_empty_string(
            dict.get('alert_id'), 'alert_id')
        self.severity: FindingSeverity = assert_is_from_enum(
            dict.get('severity'), FindingSeverity, 'severity')
        self.type: FindingType = assert_is_from_enum(
            dict.get('type'), FindingType, 'type')
        self.metadata: dict[str, str] = assert_is_string_key_to_string_value_map(
            dict.get('metadata'), 'metadata')
        self.addresses: list[str] = dict.get('addresses')
        self.labels: list[Label] = [Label(l) if not isinstance(
            l, Label) else l for l in dict.get('labels', [])]
        self.unique_key: str = dict.get('unique_key')
        self.source: FindingSource = FindingSource(
            dict.get('source')) if dict.get('source') is not None else None
        self.timestamp: datetime = dict.get(
            'timestamp', datetime.fromtimestamp(int(time.time())))
