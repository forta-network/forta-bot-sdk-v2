from enum import Enum
from typing import Any
import msgspec
from hexbytes import HexBytes
from .snake_to_camel_case import snake_to_camel_case


def enc_hook(obj: Any) -> Any:
    """Given an object that msgspec doesn't know how to serialize by
    default, convert it into an object that it does know how to
    serialize"""
    if hasattr(obj, 'repr_json'):
        return obj.repr_json()
    elif isinstance(obj, HexBytes):
        return obj.hex()
    else:
        raise NotImplementedError()


encoder = msgspec.json.Encoder(enc_hook=enc_hook)
decoder = msgspec.json.Decoder()


class JSONable():
    # extend JSONable to enable a class to convert to a json string
    def to_json(self) -> dict:
        return self.json()

    def json(self) -> dict:
        return decoder.decode(repr(self))

    def repr_json(self) -> dict:
        return {snake_to_camel_case(k): v if not isinstance(v, Enum) else v.name for k, v in self.__dict__.items() if v}

    def __repr__(self) -> str:
        return encoder.encode(self.repr_json()).decode()
