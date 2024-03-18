
from os import path
from typing import Any, Callable


class Cache:
    def __init__(self, pickledb_load: Callable, folder_path: str):
        self.db = pickledb_load(
            path.join(folder_path, "forta-bot-cache-py"), False)

    def get(self, key: str) -> Any:
        return self.db.get(key)

    def set(self, key: str, val: Any) -> bool:
        return self.db.set(key, val)

    def has(self, key: str) -> bool:
        return self.db.exists(key)

    def dump(self):
        self.db.dump()  # writes to disk cache
