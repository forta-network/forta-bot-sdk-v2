from enum import Enum
import json
import datetime
from hexbytes import HexBytes
from .snake_to_camel_case import snake_to_camel_case


class JSONable():
    # extend JSONable to enable a class to convert to a json string
    def to_json(self) -> dict:
        return self.json()

    def json(self) -> dict:
        return json.loads(repr(self))

    def repr_json(self) -> dict:
        return {snake_to_camel_case(k): v if not isinstance(v, Enum) else v.name for k, v in self.__dict__.items() if v}

    def __repr__(self) -> str:
        return json.dumps(self.repr_json(), indent=4, cls=JSONEncoder)


class JSONEncoder(json.JSONEncoder):
    # helps convert Python classes (with possibly further nested classes) into JSON
    def default(self, obj):
        if hasattr(obj, 'repr_json'):
            return obj.repr_json()
        elif isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.astimezone().isoformat()
        elif isinstance(obj, HexBytes):
            return obj.hex()
        else:
            return json.JSONEncoder.default(self, obj)
