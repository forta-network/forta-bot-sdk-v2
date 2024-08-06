from typing import Callable
from web3 import AsyncWeb3
from ..handlers import RunAttesterOnTransaction
from ..common import RunAttesterOptions
from .write_attestations_to_file import WriteAttestationsToFile

RunAttesterFile = Callable[[[
    str, RunAttesterOptions, AsyncWeb3, int]], None]


def provide_run_attester_file(
    run_attester_on_transaction: RunAttesterOnTransaction,
    write_attestations_to_file: WriteAttestationsToFile
) -> RunAttesterFile:

    async def run_attester_file(filename: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int):
        results = []
        with open(filename) as file:
            for line in file:
                hash = line.rstrip()
                tx_hash, result = await run_attester_on_transaction(hash, options, provider, chain_id)
                results.append((tx_hash, result))

        write_attestations_to_file(options, results)

    return run_attester_file
