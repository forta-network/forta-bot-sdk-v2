from typing import Optional
from ..utils import assert_is_non_empty_string, assert_is_from_enum, get_dict_val, JSONable
from .label_entity_type import EntityType
from .label_source import LabelSource


class Label(JSONable):
    def __init__(self, dict):
        entityTypeVal = get_dict_val(dict, 'entity_type')
        self.entity_type: EntityType = EntityType[entityTypeVal.title()] if type(
            entityTypeVal) == str else EntityType(entityTypeVal)
        assert_is_from_enum(self.entity_type, EntityType, 'entity_type')
        self.entity: str = assert_is_non_empty_string(
            dict.get('entity'), 'entity')
        self.confidence: float = dict['confidence']
        self.label: str = dict['label']
        self.remove: bool = dict.get('remove', False)
        self.unique_key: Optional[str] = get_dict_val(dict, 'unique_key')
        self.metadata: dict[str, str] = dict.get('metadata') if dict.get(
            'metadata') is not None else {}
        # if metadata is array, convert to map
        if type(self.metadata) == list:
            self.metadata_array_to_map()
        self.id: Optional[str] = dict.get('id')
        self.source: LabelSource = LabelSource(dict.get('source')) if dict.get(
            'source') is not None else None
        self.created_at: str = get_dict_val(dict, 'created_at')
        self.embedding: Optional[list[int]] = dict.get('embedding')

    def metadata_array_to_map(self):
        # convert string array to string key/value map using first '=' character as separator
        # (we do this because label metadata is received as string array from graphql API)
        metadata_map = {}
        for item in self.metadata:
            separator_index = item.find('=')
            key = item[0:separator_index]
            value = item[separator_index+1:len(item)]
            metadata_map[key] = value
        self.metadata = metadata_map
