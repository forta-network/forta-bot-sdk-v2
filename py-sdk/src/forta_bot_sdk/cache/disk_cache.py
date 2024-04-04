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
            chain_id, block["number"]), block)

    def get_block_with_transactions_key(self, chain_id: int, block_hash_or_number: int | str) -> str:
        return f'{chain_id}-{str(block_hash_or_number).lower()}'

    async def get_logs_for_block(self, chain_id: int, block_number: int) -> list[dict] | None:
        return self.pickledb.get(self.get_logs_for_block_key(chain_id, block_number))

    async def set_logs_for_block(self, chain_id: int, block_number: int, logs: list[dict]):
        self.pickledb.set(self.get_logs_for_block_key(
            chain_id, block_number), logs)

    def get_logs_for_block_key(self, chain_id: int, block_number: int) -> str:
        return f'{chain_id}-{block_number}-logs'

    async def get_trace_data(self, chain_id: int, block_number_or_tx_hash: int | str) -> list[dict] | None:
        return self.pickledb.get(self.get_trace_data_key(chain_id, block_number_or_tx_hash))

    async def set_trace_data(self, chain_id: int, block_number_or_tx_hash: int | str, traces: list[dict]):
        self.pickledb.set(self.get_trace_data_key(
            chain_id, block_number_or_tx_hash), traces)

    def get_trace_data_key(self, chain_id: int, block_number_or_tx_hash: int | str) -> str:
        return f'{chain_id}-{str(block_number_or_tx_hash).lower()}-trace'

    async def get_transaction_receipt(self, chain_id: int, tx_hash: str) -> dict | None:
        return self.pickledb.get(self.get_transaction_receipt_key(chain_id, tx_hash))

    async def set_transaction_receipt(self, chain_id: int, tx_hash: str, receipt: dict):
        self.pickledb.set(self.get_transaction_receipt_key(
            chain_id, tx_hash), receipt)

    def get_transaction_receipt_key(self, chain_id: int, tx_hash: str) -> str:
        return f'{chain_id}-{tx_hash.lower()}'

    async def get_alert(self, alert_hash: str) -> dict | None:
        return self.pickledb.get(self.get_alert_key(alert_hash))

    async def set_alert(self, alert_hash: str, alert: dict):
        self.pickledb.set(self.get_alert_key(alert_hash), alert)

    def get_alert_key(self, alert_hash: str) -> str:
        return f'{alert_hash.lower()}-alert'

    async def dump(self):
        self.pickledb.dump()  # writes to disk
