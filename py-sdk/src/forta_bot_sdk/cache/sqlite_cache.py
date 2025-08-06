import sqlite3
import pickle
import asyncio
from .cache import Cache


class SQLiteCache(Cache):
    def __init__(self, file_path: str):
        self.conn = sqlite3.connect(file_path)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS kv_store (
                key TEXT PRIMARY KEY,
                value BLOB
            )
        """)
        self.conn.commit()
        self.in_memory_cache = {}
        self.lock = asyncio.Lock()

    async def get_block_with_transactions(self, chain_id: int, block_hash_or_number: int | str) -> dict | None:
        return await self.get(self.get_block_with_transactions_key(chain_id, block_hash_or_number))

    async def set_block_with_transactions(self, chain_id: int, block: dict):
        block_number = int(block["number"], 0)
        await self.set(self.get_block_with_transactions_key(
            chain_id, block_number), block)
        # block_hash = block["hash"]
        # index by block hash
        # self.set(self.get_block_with_transactions_key(
        #     chain_id, block_hash), block)

    def get_block_with_transactions_key(self, chain_id: int, block_hash_or_number: int | str) -> str:
        return f'{chain_id}-{str(block_hash_or_number).lower()}'

    async def get_logs_for_block(self, chain_id: int, block_number: int) -> list[dict] | None:
        return await self.get(self.get_logs_for_block_key(chain_id, block_number))

    async def set_logs_for_block(self, chain_id: int, block_number: int, logs: list[dict]):
        await self.set(self.get_logs_for_block_key(
            chain_id, block_number), logs)

    def get_logs_for_block_key(self, chain_id: int, block_number: int) -> str:
        return f'{chain_id}-{block_number}-logs'

    async def get_trace_data(self, chain_id: int, block_number_or_tx_hash: int | str) -> list[dict] | None:
        return await self.get(self.get_trace_data_key(chain_id, block_number_or_tx_hash))

    async def set_trace_data(self, chain_id: int, block_number_or_tx_hash: int | str, traces: list[dict]):
        await self.set(self.get_trace_data_key(
            chain_id, block_number_or_tx_hash), traces)

    def get_trace_data_key(self, chain_id: int, block_number_or_tx_hash: int | str) -> str:
        return f'{chain_id}-{str(block_number_or_tx_hash).lower()}-trace'

    async def get_transaction(self, chain_id: int, tx_hash: str) -> dict | None:
        return await self.get(self.get_transaction_key(chain_id, tx_hash))

    async def set_transaction(self, chain_id: int, tx_hash: str, tx: dict):
        await self.set(self.get_transaction_key(chain_id, tx_hash), tx)

    def get_transaction_key(self, chain_id: int, tx_hash: str) -> str:
        return f'{chain_id}-{tx_hash.lower()}-tx'

    async def get_transaction_receipt(self, chain_id: int, tx_hash: str) -> dict | None:
        return await self.get(self.get_transaction_receipt_key(chain_id, tx_hash))

    async def set_transaction_receipt(self, chain_id: int, tx_hash: str, receipt: dict):
        await self.set(self.get_transaction_receipt_key(
            chain_id, tx_hash), receipt)

    def get_transaction_receipt_key(self, chain_id: int, tx_hash: str) -> str:
        return f'{chain_id}-{tx_hash.lower()}-receipt'

    async def get_alert(self, alert_hash: str) -> dict | None:
        return await self.get(self.get_alert_key(alert_hash))

    async def set_alert(self, alert_hash: str, alert: dict):
        await self.set(self.get_alert_key(alert_hash), alert)

    def get_alert_key(self, alert_hash: str) -> str:
        return f'{alert_hash.lower()}-alert'

    async def get_debug_trace_block(self, chain_id: int, block_number: int) -> list[dict] | None:
        return await self.get(self.get_debug_trace_block_key(chain_id, block_number))

    async def set_debug_trace_block(self, chain_id: int, block_number: int, traces: list[dict]):
        await self.set(self.get_debug_trace_block_key(
            chain_id, block_number), traces)

    def get_debug_trace_block_key(self, chain_id: int, block_number: int) -> str:
        return f'{chain_id}-{str(block_number).lower()}-debug-trace'

    async def get_debug_trace_transaction(self, chain_id: int, tx_hash: str) -> dict | None:
        return await self.get(self.get_debug_trace_tx_key(chain_id, tx_hash))

    async def set_debug_trace_transaction(self, chain_id: int, tx_hash: str, trace: dict) -> dict | None:
        await self.set(self.get_debug_trace_tx_key(chain_id, tx_hash), trace)

    def get_debug_trace_tx_key(self, chain_id: int, tx_hash: str):
        return f'{chain_id}-{tx_hash}-debug-trace-tx'

    async def set(self, key: str, value):
        async with self.lock:
            self.in_memory_cache[key] = pickle.dumps(value)

    async def get(self, key: str):
        async with self.lock:
            if key in self.in_memory_cache:
                return pickle.loads(self.in_memory_cache[key])

        cur = self.conn.execute(
            "SELECT value FROM kv_store WHERE key = ?", (key,))
        row = cur.fetchone()
        return pickle.loads(row[0]) if row else None

    async def dump(self):
        async with self.lock:
            items = list(self.in_memory_cache.items())
            self.in_memory_cache.clear()

        self.conn.executemany(
            "INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)",
            items
        )
        self.conn.commit()
