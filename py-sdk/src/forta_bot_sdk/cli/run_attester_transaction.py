from typing import Callable
from web3 import AsyncWeb3
from ..handlers import RunAttesterOnTransaction
from ..common import RunAttesterOptions
from .write_attestations_to_file import WriteAttestationsToFile

RunAttesterTransaction = Callable[[
    str, RunAttesterOptions, AsyncWeb3, int], None]


def provide_run_attester_transaction(
        run_attester_on_transaction: RunAttesterOnTransaction,
        write_attestations_to_file: WriteAttestationsToFile
):
    async def run_attester_transaction(tx_hash: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int) -> None:
        tx_hashes = [tx_hash]
        # support for specifying multiple transactions with comma-delimited list
        if tx_hash.find(",") >= 0:
            tx_hashes = tx_hash.split(",")

        results = []
        for hash in tx_hashes:
            tx_hash, result = await run_attester_on_transaction(hash, options, provider, chain_id)
            results.append((tx_hash, result))

        write_attestations_to_file(options, results)

    return run_attester_transaction
