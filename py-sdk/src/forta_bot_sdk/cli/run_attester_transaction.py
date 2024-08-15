from typing import Callable, Optional, Tuple
from web3 import AsyncWeb3
from ..handlers import RunAttesterOnTransaction
from ..common import RunAttesterOptions, AttestTransactionResult

RunAttesterTransaction = Callable[[
    str, RunAttesterOptions, AsyncWeb3, int], Tuple[list[Tuple[str, AttestTransactionResult]], Optional[Exception]]]


def provide_run_attester_transaction(
    run_attester_on_transaction: RunAttesterOnTransaction
):
    async def run_attester_transaction(tx_hash: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int) -> None:
        tx_hashes = [tx_hash]
        # support for specifying multiple transactions with comma-delimited list
        if tx_hash.find(",") >= 0:
            tx_hashes = tx_hash.split(",")

        results = []
        error = None
        try:
            for hash in tx_hashes:
                tx_hash, result = await run_attester_on_transaction(hash, options, provider, chain_id)
                results.append((tx_hash, result))
        except Exception as e:
            error = e

        return results, error

    return run_attester_transaction
