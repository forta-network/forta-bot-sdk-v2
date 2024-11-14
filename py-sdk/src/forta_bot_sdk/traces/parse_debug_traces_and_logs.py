
from typing import Callable, Tuple
from collections import deque
from ..logs import Log
from ..utils import hex_to_int
from .trace import Trace

ParseDebugTracesAndLogs = Callable[[dict], Tuple[list[Trace], list[Log]]]


def provide_parse_debug_traces_and_logs() -> ParseDebugTracesAndLogs:

    # parse the dict from debug_traceCall/debug_traceTransaction using a depth-first search
    def parse_debug_traces_and_logs(debug_trace: dict) -> Tuple[list[Trace], list[Log]]:
        traces: list[Trace] = []
        raw_logs: list[dict] = []

        stack = deque()
        stack.append(debug_trace)
        while (len(stack) > 0):
            trace = stack.pop()
            trace_dict = {
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
            }
            trace_error = trace.get("error")
            if trace_error:
                trace_dict['error'] = trace_error
                for subtrace in trace.get("calls", []):
                    subtrace['error'] = trace_error
            traces.append(Trace(trace_dict))
            # keep track of event logs
            if trace.get("logs"):
                for log in trace.get("logs"):
                    raw_logs.append(log)
            # add any sub-traces to the stack
            if trace.get("calls"):
                # reversed so that we pop the first subtrace first
                for subtrace in reversed(trace.get("calls")):
                    stack.append(subtrace)

        if len(raw_logs) > 0:
            # some chains (e.g. arbitrum) use different field name for log index
            if "index" not in raw_logs[0] and "position" in raw_logs[0]:
                for raw_log in raw_logs:
                    raw_log["index"] = hex_to_int(raw_log["position"])
            # some chains dont have any index/position field
            elif "index" not in raw_logs[0]:
                for i, raw_log in enumerate(raw_logs):
                    raw_log["index"] = i
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

    return parse_debug_traces_and_logs
