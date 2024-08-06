import os
import asyncio
from typing import Callable, Optional, TypedDict
from aiohttp import ClientSession
from web3 import AsyncWeb3
from ..cache import Cache
from ..utils import FortaConfig, assert_exists, assert_is_non_empty_string, GetAioHttpSession
from ..common import RunAttesterOptions
from .run_attester_transaction import RunAttesterTransaction
from .run_attester_block import RunAttesterBlock
from .run_attester_block_range import RunAttesterBlockRange
from .run_attester_file import RunAttesterFile


class RunAttesterCliCommandOptions(TypedDict):
    run_attester_options: Optional[RunAttesterOptions]


RunAttesterCliCommand = Callable[[RunAttesterCliCommandOptions], None]


def provide_run_attester_cli_command(
    get_aiohttp_session: GetAioHttpSession,
    run_attester_transaction: RunAttesterTransaction,
    run_attester_block: RunAttesterBlock,
    run_attester_block_range: RunAttesterBlockRange,
    run_attester_file: RunAttesterFile,
    forta_config: FortaConfig,
    cache: Cache
) -> RunAttesterCliCommand:
    assert_exists(get_aiohttp_session, 'get_aiohttp_session')
    assert_exists(run_attester_transaction, 'run_attester_transaction')
    assert_exists(run_attester_block, 'run_attester_block')
    assert_exists(run_attester_block_range, 'run_attester_block_range')
    assert_exists(run_attester_file, 'run_attester_file')
    assert_exists(cache, 'cache')

    async def run_attester_cli_command(options: RunAttesterCliCommandOptions) -> None:
        run_attester_options = options.get('run_attester_options')

        chain_id = int(os.environ.get('FORTA_CHAIN_ID'))
        assert_exists(chain_id, 'chainId')

        FORTA_CLI_TX = os.environ.get('FORTA_CLI_TX')
        FORTA_CLI_BLOCK = os.environ.get('FORTA_CLI_BLOCK')
        FORTA_CLI_RANGE = os.environ.get('FORTA_CLI_RANGE')
        FORTA_CLI_FILE = os.environ.get('FORTA_CLI_FILE')
        FORTA_CLI_OUTPUT = os.environ.get('FORTA_CLI_OUTPUT')
        if FORTA_CLI_OUTPUT:
            run_attester_options['output_file'] = FORTA_CLI_OUTPUT

        local_rpc_urls = forta_config.get('localRpcUrls', {})
        rpc_url = local_rpc_urls.get(
            chain_id) or local_rpc_urls.get(str(chain_id))
        assert_is_non_empty_string(rpc_url, 'rpc_url')
        provider = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(rpc_url))

        if FORTA_CLI_TX:
            await run_attester_transaction(FORTA_CLI_TX, run_attester_options, provider, chain_id)
            await cleanup(get_aiohttp_session)
        elif FORTA_CLI_BLOCK:
            await run_attester_block(FORTA_CLI_BLOCK, run_attester_options, provider, chain_id)
            await cleanup(get_aiohttp_session)
        elif FORTA_CLI_RANGE:
            await run_attester_block_range(FORTA_CLI_RANGE, run_attester_options, provider, chain_id)
            await cleanup(get_aiohttp_session)
        elif FORTA_CLI_FILE:
            await run_attester_file(FORTA_CLI_FILE, run_attester_options, provider, chain_id)
            await cleanup(get_aiohttp_session)

        if "FORTA_CLI_NO_CACHE" not in os.environ:
            # persists any cached blocks/txs/traces to disk
            await cache.dump()

    return run_attester_cli_command


async def cleanup(get_aiohttp_session: GetAioHttpSession):
    # clean up the aiohttp session (otherwise it throws an ugly error on process completion)
    # https://docs.aiohttp.org/en/stable/client_advanced.html#graceful-shutdown
    session: ClientSession = await get_aiohttp_session()
    await asyncio.sleep(0.25)
    await session.close()
