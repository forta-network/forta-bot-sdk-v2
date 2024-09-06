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

        for hash in tx_hashes:
            try:
                tx_hash, result = await run_attester_on_transaction(hash, options, provider, chain_id)
                results.append((tx_hash, result))
            except Exception as e:
                errors.append((tx_hash, e))
                logger.error(f'{tx_hash}, {format_exception(e)}', True)

        return results, errors

    return run_attester_transaction
