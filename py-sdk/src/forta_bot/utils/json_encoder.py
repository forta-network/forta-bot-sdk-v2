import json
import datetime
from hexbytes import HexBytes


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
