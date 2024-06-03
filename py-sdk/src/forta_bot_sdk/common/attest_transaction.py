

from typing import Callable
from ..transactions import TransactionEvent


AttestTransaction = Callable[[TransactionEvent], bool]
