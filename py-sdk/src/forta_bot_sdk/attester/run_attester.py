
import asyncio
from datetime import datetime
from typing import Any, Callable, Optional, TypedDict
from aiohttp import web
from ..transactions import CreateTransactionEvent
from ..utils import Logger, format_exception, assert_exists
from ..common import AttestTransaction


RunAttester = Callable[[Any], None]


class RunAttesterOptions(TypedDict):
    attest_transaction: Optional[AttestTransaction]


def provide_run_attester(attester_port: int, create_transaction_event: CreateTransactionEvent, logger: Logger):
    assert_exists(create_transaction_event, 'create_transaction_event')
    assert_exists(logger, 'logger')

    async def run_attester(options: RunAttesterOptions):
        attest_transaction = options['attest_transaction']
        assert_exists(attest_transaction, 'attest_transaction')

        async def attester_handler(request):
            status: int = 200
            body: dict = await request.json()
            try:
                tx = {'from': body['from'],
                      'to': body['to'], 'data': body['calldata']}
                tx_event = create_transaction_event(
                    tx, {}, 1, body['traces'], [])
                is_attested = await attest_transaction(tx_event)
            except Exception as e:
                logger.error(
                    f'{datetime.now().isoformat()}    attest_transaction')
                logger.error(format_exception(e))
                status = 500
            return web.json_response({'malicious': not is_attested}, status=status)

        # run the http server
        app = web.Application()
        app.add_routes([web.get('/', attester_handler)])
        await web._run_app(app=app, port=attester_port)

    return run_attester
