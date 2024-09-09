
from typing import Optional, TypedDict
from .attest_transaction import AttestTransaction


class RunAttesterOptions(TypedDict):
    attest_transaction: AttestTransaction
    # specify an output file to write results to
    output_file: Optional[str]
    # specify a dict of addresses to filter for
    filter_addresses: Optional[dict[str, bool]]
