from typing import Callable, Tuple
from ..common import AttestTransactionResult, RunAttesterOptions
from ..utils import now


WriteAttestationsToFile = Callable[[
    RunAttesterOptions, list[Tuple[str, AttestTransactionResult]]], None]


def provide_write_attestations_to_file():
    def write_attestations_to_file(options: RunAttesterOptions, results: list[Tuple[str, AttestTransactionResult]]):
        output_file = options.get('output_file')
        if not output_file:
            return
        if len(results) == 0:
            return

        # write the results to file
        with open(f'{output_file}-{now()}', 'a') as f:
            lines = []
            for result in results:
                tx_hash, attestation = result
                lines.append(
                    f'{tx_hash}, {attestation["risk_score"]}, {attestation["metadata"]}')
            f.write("\n".join(lines))

    return write_attestations_to_file
