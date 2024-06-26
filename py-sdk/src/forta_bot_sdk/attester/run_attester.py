from datetime import datetime
from typing import Any, Callable, Optional, Tuple, TypedDict
from aiohttp import web
from ..transactions import CreateTransactionEvent
from ..traces import Trace
from ..logs import Log
from ..utils import Logger, format_exception, assert_exists, hex_to_int
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
                chain_id = body.get('chainId', 1)
                tx = {'from': body['from'],
                      'to': body['to'], 'data': body['calldata']}
                traces, logs = parse_logs_and_traces(body['traces'])
                tx_event = create_transaction_event(
                    tx, {}, chain_id, traces, logs)
                is_attested = await attest_transaction(tx_event)
            except Exception as e:
                logger.error(
                    f'{datetime.now().isoformat()}    attest_transaction')
                logger.error(format_exception(e))
                status = 500
            return web.json_response({'malicious': not is_attested}, status=status)

        # run the http server
        HUNDRED_MB = 100000000  # max payload size accepted
        app = web.Application(client_max_size=HUNDRED_MB)
        app.add_routes([web.post('/', attester_handler)])
        await web._run_app(app=app, port=attester_port)

    return run_attester


def parse_logs_and_traces(raw_traces: dict) -> Tuple[list[Trace], list[Log]]:
    traces: list[Trace] = []
    raw_logs: list[dict] = []

    stack = [raw_traces]
    # parse the raw_traces (from debug_traceCall) using a depth-first search
    while (len(stack) > 0):
        trace = stack.pop()
        traces.append(Trace({
            "action": {
                "callType": trace.get("type").lower(),
                "to": trace.get("to"),
                "input": trace.get("input"),
                "from": trace.get("from"),
                "value": hex_to_int(trace.get("value")) if "value" in trace else 0
            },
            "result": {
                "gasUsed": trace.get("gasUsed"),
                "output": trace.get("output") or "0x"
            },
            "subtraces": len(trace.get("calls") or [])
        }))
        # keep track of event logs
        if trace.get("logs"):
            for log in trace.get("logs"):
                raw_logs.append(log)
        # add any sub-traces to the stack
        if trace.get("calls"):
            for subtrace in trace.get("calls"):
                stack.append(subtrace)

    # some chains (e.g. arbitrum) use different field name for log index
    if len(raw_logs) > 0 and "index" not in raw_logs[0] and "position" in raw_logs[0]:
        for raw_log in raw_logs:
            raw_log["index"] = hex_to_int(raw_log["position"])
    # sort the raw logs by index and create Log objects
    sorted_logs = sorted(raw_logs, key=lambda log: log["index"])
    logs: list[Log] = []
    for log in sorted_logs:
        logs.append(Log({
            "address": log.get("address"),
            "topics": log.get("topics"),
            "data": log.get("data"),
            "logIndex": log.get("index")
        }))

    return traces, logs
