from typing import Callable
from ..logs import Log
from ..utils import format_address, is_zero_address, get_create_address
from ..traces import Trace
from .transaction_event import TransactionEvent

CreateTransactionEvent = Callable[[
    dict, dict, int, list[Trace], list[Log]], TransactionEvent]


def provide_create_transaction_event():

    def create_transaction_event(transaction: dict, block: dict, chain_id: int, traces: list[Trace] = [], logs: list[Log] = []):
        if traces is None:
            traces = []
        traces = list(
            map(lambda t: Trace(t) if not isinstance(t, Trace) else t, traces))
        if logs is None:
            logs = []
        logs = list(
            map(lambda l: Log(l) if not isinstance(l, Log) else l, logs))

        # build map of addresses involved in transaction
        addresses = {}
        addresses[format_address(transaction['from'])] = True
        if transaction.get('to') is not None:
            addresses[format_address(transaction['to'])] = True
        for trace in traces:
            if trace.action.address is not None:
                addresses[trace.action.address] = True
            if trace.action.refund_address is not None:
                addresses[trace.action.refund_address] = True
            if trace.action.to is not None:
                addresses[trace.action.to] = True
            if trace.action.from_ is not None:
                addresses[trace.action.from_] = True
        for log in logs:
            addresses[log.address] = True

        contract_address = None
        if (is_zero_address(transaction.get('to'))):
            contract_address = format_address(get_create_address(
                transaction['from'], transaction['nonce']))

        return TransactionEvent({
            'chain_id': chain_id,
            'transaction': transaction,
            'block': block,
            'traces': traces,
            'logs': logs,
            'addresses': addresses,
            'contract_address': contract_address
        })

    return create_transaction_event
