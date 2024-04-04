import json
from typing import Optional
from web3 import Web3
from ..logs import Log, provide_filter_logs
from ..traces import Trace
from ..utils import JSONable
from .transaction import Transaction


class TxEventBlock(JSONable):
    def __init__(self, dict):
        self.hash: str = dict.get('hash')
        self.number: int = dict.get('number')
        self.timestamp: int = dict.get('timestamp')


filter_logs = provide_filter_logs()


class TransactionEvent(JSONable):
    def __init__(self, dict):
        self.chain_id: int = dict.get('chain_id', dict.get('network'))
        transaction = dict.get('transaction', {})
        self.transaction: Transaction = transaction if isinstance(
            transaction, Transaction) else Transaction(transaction)
        self.traces: list[Trace] = [Trace(t) if not isinstance(
            t, Trace) else t for t in dict.get('traces', [])]
        self.addresses: dict[str, bool] = dict.get('addresses', {})
        self.block: TxEventBlock = TxEventBlock(dict.get('block', {}))
        self.logs: list[Log] = [Log(l) if not isinstance(
            l, Log) else l for l in dict.get('logs', [])]
        self.contract_address: Optional[str] = dict.get('contract_address')

    @property
    def network(self):
        return self.chain_id

    @property
    def hash(self):
        return self.transaction.hash

    @property
    def to(self):
        return self.transaction.to

    @property
    def from_(self):
        return self.transaction.from_

    @property
    def gas_price(self):
        return self.transaction.gas_price

    @property
    def timestamp(self):
        return self.block.timestamp

    @property
    def block_number(self):
        return self.block.number

    @property
    def block_hash(self):
        return self.block.hash

    def filter_log(self, abi, contract_address=''):
        return filter_logs(self.logs, abi, contract_address)

    def filter_function(self, abi, contract_address=''):
        abi = abi if isinstance(abi, list) else [abi]
        abi = [json.loads(abi_object) for abi_object in abi]
        # determine where to look for function calls (i.e. transaction object or traces)
        sources = [{'data': self.transaction.data, 'to': self.transaction.to}]
        if self.traces:
            sources = [{'data': trace.action.input,
                        'to': trace.action.to} for trace in self.traces]
        # filter by contract address, if provided
        if (contract_address):
            contract_address = contract_address if isinstance(
                contract_address, list) else [contract_address]
            contract_address_map = {
                address.lower(): True for address in contract_address}
            sources = filter(
                lambda source: source['to'] and source['to'].lower() in contract_address_map, sources)
        # parse function inputs
        results = []
        contract = Web3().eth.contract(
            "0x0000000000000000000000000000000000000000", abi=abi)
        for source in sources:
            try:
                decoded_function = contract.decode_function_input(
                    source['data'])
                decoded_function[1]["address"] = source['to'].lower()
                results.append(decoded_function)
            except:
                continue  # TODO see if theres a better way to handle 'no matching function' error
        return results
