from typing import Callable, Optional, Tuple
from web3 import AsyncWeb3
from ..common import RunAttesterOptions, AttestTransactionResult
from ..handlers import RunAttesterOnTransaction
from ..providers import GetProvider

RunAttesterFile = Callable[[[
    str, RunAttesterOptions, AsyncWeb3, int]], Tuple[list[Tuple[str, AttestTransactionResult]], Optional[Exception]]]


def provide_run_attester_file(
    run_attester_on_transaction: RunAttesterOnTransaction,
    get_provider: GetProvider
) -> RunAttesterFile:

    async def run_attester_file(filename: str, options: RunAttesterOptions, provider: AsyncWeb3, chain_id: int, results=[]):
        error = None
        try:
            with open(filename) as file:
                for line in file:
                    tx_hash = line.strip()
                    tx_chain_id = None
                    tx_provider = None
                    # optionally, the chain id can be specified for each tx
                    if "," in line:
                        tx_hash, tx_chain_id = line.split(",")
                        tx_hash = tx_hash.strip()
                        tx_chain_id = int(tx_chain_id.strip())
                        tx_provider = await get_provider({"local_rpc_url": str(tx_chain_id)})

                    _, result = await run_attester_on_transaction(tx_hash, options, tx_provider or provider, tx_chain_id or chain_id)
                    results.append((tx_hash, result))
        except Exception as e:
            error = e

        return results, error

    return run_attester_file
