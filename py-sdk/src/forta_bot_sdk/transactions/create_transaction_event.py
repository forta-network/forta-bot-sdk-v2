from typing import Callable
from ..logs import Log
from ..utils import format_address, is_zero_address, get_create_address
from ..traces import Trace
from ..blocks import Block
from .transaction_event import TransactionEvent
from .transaction import Transaction

CreateTransactionEvent = Callable[[
    Transaction, Block, int, list[Trace], list[Log]], TransactionEvent]


def provide_create_transaction_event():

    def create_transaction_event(transaction: dict | Transaction, block: dict | Block, chain_id: int, traces: list[Trace] = [], logs: list[Log] = []):
        if not isinstance(transaction, Transaction):
            transaction = Transaction(transaction)
        if not isinstance(block, Block):
            block = Block(block)
        if traces is None:
            traces = []
        traces = [Trace(t) if not isinstance(t, Trace) else t for t in traces]
        if logs is None:
            logs = []
        logs = [Log(l) if not isinstance(l, Log) else l for l in logs]

        # build map of addresses involved in transaction
        addresses = {}
        addresses[transaction.from_] = True
        if transaction.to is not None:
            addresses[transaction.to] = True
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
        if (is_zero_address(transaction.to)):
            contract_address = format_address(get_create_address(
                transaction.from_, transaction.nonce))

        return TransactionEvent({
            'chain_id': chain_id,
            'transaction': transaction,
            'block': block.to_json(),
            'traces': traces,
            'logs': logs,
            'addresses': addresses,
            'contract_address': contract_address
        })

    return create_transaction_event
