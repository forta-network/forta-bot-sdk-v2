from datetime import datetime
from typing import Callable, Optional
from ...findings import Finding
from ...utils import assert_exists, GetBotId, Sleep, Logger
from ...cli import RunCliCommand
from ...blocks import GetLatestBlockNumber
from ...alerts import SendAlerts
from ...utils import GetChainId, format_exception
from ...handlers import RunHandlersOnBlock
from ...common import ScanEvmOptions
from ..should_submit_findings import ShouldSubmitFindings
from ..should_stop_on_errors import ShouldStopOnErrors
from .get_block_time import GetBlockTime
from .get_provider import GetProvider

ScanEvm = Callable[[ScanEvmOptions], None]


def provide_scan_evm(
    get_bot_id: GetBotId,
    get_provider: GetProvider,
    get_chain_id: GetChainId,
    is_running_cli_command: bool,
    run_cli_command: RunCliCommand,
    get_block_time: GetBlockTime,
    get_latest_block_number: GetLatestBlockNumber,
    run_handlers_on_block: RunHandlersOnBlock,
    send_alerts: SendAlerts,
    should_submit_findings: ShouldSubmitFindings,
    should_stop_on_errors: ShouldStopOnErrors,
    sleep: Sleep,
    is_prod: bool,
    forta_chain_id: Optional[int],
    forta_shard_id: Optional[int],
    forta_shard_count: Optional[int],
    logger: Logger,
    should_continue_polling: Callable = lambda: True
) -> ScanEvm:
    assert_exists(get_bot_id, 'get_bot_id')
    assert_exists(get_provider, 'get_provider')
    assert_exists(get_chain_id, 'get_chain_id')
    assert_exists(run_cli_command, 'run_cli_command')
    assert_exists(get_block_time, 'get_block_time')
    assert_exists(get_latest_block_number, 'get_latest_block_number')
    assert_exists(run_handlers_on_block, 'run_handlers_on_block')
    assert_exists(send_alerts, 'send_alerts')
    assert_exists(should_submit_findings, 'should_submit_findings')
    assert_exists(should_stop_on_errors, 'should_stop_on_errors')
    assert_exists(sleep, 'sleep')
    assert_exists(logger, 'logger')

    async def scan_evm(options: ScanEvmOptions) -> None:
        if options.get('handle_block') is None and options.get('handle_transaction') is None:
            raise Exception("no block/transaction handler provided")

        bot_id = get_bot_id()
        provider = await get_provider(options)
        chain_id = await get_chain_id(provider)

        # if running a cli command, then dont start scanning
        if is_running_cli_command:
            await run_cli_command({'scan_evm_options': options, 'provider': provider, 'chain_id': chain_id})
            return

        # if scanning for a specific chain and its not this one, dont do anything
        if forta_chain_id is not None and forta_chain_id != chain_id:
            return

        logger.info(f'listening for data on chain {chain_id}...')
        last_submission_timestamp = datetime.now()  # initialize to now
        # when running in production, poll every 10 seconds (to match the json-rpc cache)
        polling_interval_seconds = 10 if is_prod else get_block_time(chain_id)
        current_block_number: Optional[int] = None
        findings: list[Finding] = []

        # poll for latest blocks
        while (should_continue_polling()):
            try:
                # get_provider checks for expired RPC JWTs (so we call it often)
                provider = await get_provider(options)
                latest_block_number = await get_latest_block_number(chain_id, provider)
                if current_block_number is None:
                    current_block_number = latest_block_number

                # if no new blocks
                if (current_block_number > latest_block_number):
                    # wait for a bit
                    await sleep(polling_interval_seconds)
                else:
                    # process new blocks
                    while current_block_number <= latest_block_number:
                        # check if this block should be processed
                        if is_block_on_this_shard(current_block_number, forta_shard_id, forta_shard_count):
                            start = datetime.now().timestamp()
                            logger.debug(
                                f'run_handlers_on_block:{chain_id}:{current_block_number}:start')
                            # process block
                            block_findings = await run_handlers_on_block(current_block_number, options, provider, chain_id, should_stop_on_errors())
                            findings.extend(block_findings)
                            logger.debug(
                                f'run_handlers_on_block:{chain_id}:{current_block_number}:end took {datetime.now().timestamp()-start}s ({len(block_findings)} findings, total={len(findings)})')
                        current_block_number += 1

                # check if should submit any findings
                if should_submit_findings(findings, last_submission_timestamp):
                    try:
                        logger.debug(f'sending {len(findings)} alerts...')
                        await send_alerts([{'bot_id': bot_id, 'finding': f} for f in findings])
                        logger.debug(
                            f'successfully submitted {len(findings)} alerts.')
                        findings = []  # clear array
                        last_submission_timestamp = datetime.now()  # remember timestamp
                    except Exception as e:
                        logger.error(
                            f'error submitting alerts: {format_exception(e)}')
            except Exception as e:
                logger.error(
                    f'error occurred at block {current_block_number} on chain {chain_id}')
                if should_stop_on_errors():
                    raise e
                logger.error(format_exception(e))

    return scan_evm


def is_block_on_this_shard(block_number: int, shard_id: Optional[int], shard_count: Optional[int]) -> bool:
    # if bot is not sharded
    if shard_id is None or shard_count is None:
        return True  # process everything

    # process block if block_number modulo shard_count equals shard_id
    return block_number % shard_count == shard_id
