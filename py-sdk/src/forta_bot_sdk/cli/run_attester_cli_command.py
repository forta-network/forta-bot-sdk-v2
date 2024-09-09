
import signal
import sys
import os
import asyncio
from typing import Callable, Optional, TypedDict
from aiohttp import ClientSession
from ..cache import Cache
from ..utils import assert_exists, GetAioHttpSession
from ..common import RunAttesterOptions
from ..providers import GetProvider
from .run_attester_transaction import RunAttesterTransaction
from .run_attester_block import RunAttesterBlock
from .run_attester_block_range import RunAttesterBlockRange
from .run_attester_file import RunAttesterFile
from .write_attestations_to_file import WriteAttestationsToFile


class RunAttesterCliCommandOptions(TypedDict):
    run_attester_options: Optional[RunAttesterOptions]


RunAttesterCliCommand = Callable[[RunAttesterCliCommandOptions], None]


def provide_run_attester_cli_command(
    get_aiohttp_session: GetAioHttpSession,
    get_provider: GetProvider,
    run_attester_transaction: RunAttesterTransaction,
    run_attester_block: RunAttesterBlock,
    run_attester_block_range: RunAttesterBlockRange,
    run_attester_file: RunAttesterFile,
    write_attestations_to_file: WriteAttestationsToFile,
    cache: Cache
) -> RunAttesterCliCommand:
    assert_exists(get_aiohttp_session, 'get_aiohttp_session')
    assert_exists(get_provider, 'get_provider')
    assert_exists(run_attester_transaction, 'run_attester_transaction')
    assert_exists(run_attester_block, 'run_attester_block')
    assert_exists(run_attester_block_range, 'run_attester_block_range')
    assert_exists(run_attester_file, 'run_attester_file')
    assert_exists(write_attestations_to_file, 'write_attestations_to_file')
    assert_exists(cache, 'cache')

    async def run_attester_cli_command(options: RunAttesterCliCommandOptions) -> None:
        run_attester_options = options.get('run_attester_options')

        chain_id = None
        FORTA_CLI_CHAIN_ID = os.environ.get('FORTA_CHAIN_ID')
        if FORTA_CLI_CHAIN_ID:
            chain_id = int(FORTA_CLI_CHAIN_ID)
        FORTA_CLI_TX = os.environ.get('FORTA_CLI_TX')
        FORTA_CLI_BLOCK = os.environ.get('FORTA_CLI_BLOCK')
        FORTA_CLI_RANGE = os.environ.get('FORTA_CLI_RANGE')
        FORTA_CLI_FILE = os.environ.get('FORTA_CLI_FILE')
        FORTA_CLI_OUTPUT = os.environ.get('FORTA_CLI_OUTPUT')
        FORTA_CLI_ADDRESSES = os.environ.get('FORTA_CLI_ADDRESSES')
        if FORTA_CLI_OUTPUT:
            run_attester_options['output_file'] = FORTA_CLI_OUTPUT
        if FORTA_CLI_ADDRESSES:
            filter_addresses = {}
            if FORTA_CLI_ADDRESSES.startswith("0x"):
                # parse addresses (potentially more than one)
                parsed_addresses = FORTA_CLI_ADDRESSES.strip().lower().split(",")
                for address in parsed_addresses:
                    filter_addresses[address] = True
            else:
                # read addresses from specified file
                with open(FORTA_CLI_ADDRESSES) as addresses_file:
                    for line in addresses_file:
                        filter_addresses[line.strip().lower()] = True
            run_attester_options['filter_addresses'] = filter_addresses

        # setup the provider if chain id was specified as commandline arg
        # (with the --file option the user can alternatively specify chain id in the file)
        provider = None
        if chain_id:
            provider = await get_provider({'local_rpc_url': str(chain_id)})

        results = []
        errors = []

        # write any attestations to file in case of manual process exit
        def signal_handler(sig, frame):
            write_attestations_to_file(run_attester_options, results, errors)
            sys.exit(0)
        signal.signal(signal.SIGINT, signal_handler)

        if FORTA_CLI_TX:
            results, errors = await run_attester_transaction(FORTA_CLI_TX, run_attester_options, provider, chain_id, results, errors)
        elif FORTA_CLI_BLOCK:
            results, errors = await run_attester_block(FORTA_CLI_BLOCK, run_attester_options, provider, chain_id, results, errors)
        elif FORTA_CLI_RANGE:
            results, errors = await run_attester_block_range(FORTA_CLI_RANGE, run_attester_options, provider, chain_id, results, errors)
        elif FORTA_CLI_FILE:
            results, errors = await run_attester_file(FORTA_CLI_FILE, run_attester_options, provider, chain_id, results, errors)

        write_attestations_to_file(run_attester_options, results, errors)

        if "FORTA_CLI_NO_CACHE" not in os.environ:
            # persists any cached blocks/txs/traces to disk
            await cache.dump()

        await cleanup(get_aiohttp_session)

    return run_attester_cli_command


async def cleanup(get_aiohttp_session: GetAioHttpSession):
    # clean up the aiohttp session (otherwise it throws an ugly error on process completion)
    # https://docs.aiohttp.org/en/stable/client_advanced.html#graceful-shutdown
    session: ClientSession = await get_aiohttp_session()
    await asyncio.sleep(0.25)
    await session.close()
