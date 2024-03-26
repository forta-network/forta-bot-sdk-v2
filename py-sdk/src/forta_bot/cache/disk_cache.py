from os import path
from typing import Callable
from .cache import Cache


class DiskCache(Cache):
    def __init__(self, pickledb_load: Callable, folder_path: str):
        self.pickledb = pickledb_load(
            path.join(folder_path, "forta-bot-cache-py"), False)

    async def get_block_with_transactions(self, chain_id: int, block_hash_or_number: int | str) -> dict | None:
        return self.pickledb.get(self.get_block_with_transactions_key(chain_id, block_hash_or_number))

    async def set_block_with_transactions(self, chain_id: int, block: dict):
        # index by block hash
        self.pickledb.set(self.get_block_with_transactions_key(
            chain_id, block["hash"]), block)
        # also index by block number
        self.pickledb.set(self.get_block_with_transactions_key(
            chain_id, int(block["number"]), 0), block)

    def get_block_with_transactions_key(chain_id: int, block_hash_or_number: int | str) -> str:
        return f'{chain_id}-{str(block_hash_or_number).lower()}'

    async def get_logs_for_block(self, chain_id: int, block_number: int) -> list[dict] | None:
        return self.pickledb.get(self.get_logs_for_block_key(chain_id, block_number))

    async def set_logs_for_block(self, chain_id: int, block_number: int, logs: list[dict]):
        self.pickledb.set(self.get_logs_for_block_key(
            chain_id, block_number), logs)

    def get_logs_for_block_key(chain_id: int, block_number: int) -> str:
        return f'{chain_id}-{block_number}-logs'

    async def dump(self):
        self.pickledb.dump()  # writes to disk
