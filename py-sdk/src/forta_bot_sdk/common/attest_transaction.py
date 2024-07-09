

from typing import Callable, TypedDict
from ..transactions import TransactionEvent


class AttestTransactionResult(TypedDict):
    risk_score: int
    metadata: dict[str, str]


AttestTransaction = Callable[[TransactionEvent], AttestTransactionResult]
