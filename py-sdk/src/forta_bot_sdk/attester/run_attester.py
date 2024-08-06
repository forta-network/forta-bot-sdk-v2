from datetime import datetime
from typing import Any, Callable
from aiohttp import web
from ..cli import RunAttesterCliCommand
from ..transactions import CreateTransactionEvent
from ..traces import ParseDebugTracesAndLogs
from ..utils import Logger, format_exception, assert_exists, hex_to_int
from ..common import RunAttesterOptions


RunAttester = Callable[[Any], None]


def provide_run_attester(
    attester_port: int,
    create_transaction_event: CreateTransactionEvent,
    is_running_cli_command: bool,
    run_attester_cli_command: RunAttesterCliCommand,
    parse_debug_traces_and_logs: ParseDebugTracesAndLogs,
    logger: Logger
) -> RunAttester:
    assert_exists(create_transaction_event, 'create_transaction_event')
    assert_exists(logger, 'logger')

    async def run_attester(options: RunAttesterOptions):
        attest_transaction = options.get('attest_transaction')
        assert_exists(attest_transaction, 'attest_transaction')

        # if running a cli command, then dont start the server
        if is_running_cli_command:
            await run_attester_cli_command({'run_attester_options': options})
            return

        async def attester_handler(request):
            body: dict = await request.json()
            try:
                chain_id = body.get('chainId', 1)
                tx = {
                    'from': body['from'],
                    'to': body['to'],
                    'data': body['calldata'],
                    'nonce': body.get('nonce')
                }
                traces, logs = parse_debug_traces_and_logs(body['traces'])
                tx_event = create_transaction_event(
                    tx, {}, chain_id, traces, logs)
                result = await attest_transaction(tx_event)
                return web.json_response({
                    'riskScore': result.get('risk_score'),
                    'metadata': result.get('metadata')
                }, status=200)
            except Exception as e:
                logger.error(
                    f'{datetime.now().isoformat()}    attest_transaction')
                logger.error(format_exception(e))
                return web.json_response({}, status=500)

        async def health_check_handler(request):
            return web.json_response({"health": "ok"}, status=200)

        # run the http server
        HUNDRED_MB = 100000000  # max payload size accepted
        app = web.Application(client_max_size=HUNDRED_MB)
        app.add_routes([
            web.post('/', attester_handler),
            web.get('/health', health_check_handler)
        ])
        await web._run_app(app=app, port=attester_port)

    return run_attester
