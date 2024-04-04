from typing import Optional


# informal interface for cache
class Cache:
    async def get_latest_block_number(self, chain_id: int) -> Optional[str]:
        return None

    async def get_block_with_transactions(self, chain_id: int, block_hash_or_number: int | str) -> Optional[dict]:
        return None

    async def set_block_with_transactions(self, chain_id: int, block: dict):
        return None

    async def get_logs_for_block(self, chain_id: int, block_number: int) -> Optional[list[dict]]:
        return None

    async def set_logs_for_block(self, chain_id: int, block_number: int, logs: list[dict]):
        return None

    async def get_trace_data(self, chain_id: int, block_number_or_tx_hash: int | str) -> Optional[list[dict]]:
        return None

    async def set_trace_data(self, chain_id: int, block_number_or_tx_hash: int | str, traces: list[dict]):
        return None

    async def get_transaction_receipt(self, chain_id: int, tx_hash: str) -> Optional[dict]:
        return None

    async def set_transaction_receipt(self, chain_id: int, tx_hash: str, receipt: dict):
        return None

    async def get_alert(self, alert_hash: str) -> Optional[dict]:
        return None

    async def set_alert(self, alert_hash: str, alert: dict):
        return None

    async def dump():
        return None
