
from typing import Optional, TypedDict
from .attest_transaction import AttestTransaction


class RunAttesterOptions(TypedDict):
    attest_transaction: Optional[AttestTransaction]
    output_file: Optional[str]
