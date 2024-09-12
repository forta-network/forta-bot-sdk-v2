import asyncio
from typing import Callable, Tuple
from web3 import AsyncWeb3
from ..handlers import RunAttesterOnTransaction
from ..common import RunAttesterOptions, AttestTransactionResult
from ..utils import Logger, assert_exists, format_exception

RunAttesterTransaction = Callable[[
    str, RunAttesterOptions, AsyncWeb3, int], Tuple[list[Tuple[str, AttestTransactionResult]], list[Tuple[str, Exception]]]]


def provide_run_attester_transaction(
    run_attester_on_transaction: RunAttesterOnTransaction,
    logger: Logger
):
    assert_exists(run_attester_on_transaction, 'run_attester_on_transaction')
    assert_exists(logger, 'logger')

    async def run_attester_transaction(tx_hash: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int, results=[], errors=[]) -> None:
        tx_hashes = [tx_hash]
        # support for specifying multiple transactions with comma-delimited list
        if tx_hash.find(",") >= 0:
            tx_hashes = tx_hash.split(",")

        batch_size = options.get('concurrency', 1)
        # attest the transactions in batches
        for i in range(0, len(tx_hashes), batch_size):
            tx_batch = tx_hashes[i: min(i+batch_size, len(tx_hashes))]
            coroutines = [run_attester_on_transaction(
                hash, options, provider, chain_id, results, errors) for hash in tx_batch]
            await asyncio.gather(*coroutines)

        return results, errors

    return run_attester_transaction
