from typing import Callable, Tuple
from .attest_transaction import AttestTransactionResult
from .run_attester_options import RunAttesterOptions


WriteAttestationsToFile = Callable[[
    RunAttesterOptions, list[Tuple[str, AttestTransactionResult]], list[Tuple[str, Exception]]], None]


def provide_write_attestations_to_file():
    def write_attestations_to_file(options: RunAttesterOptions, results: list[Tuple[str, AttestTransactionResult]], errors: list[Tuple[str, Exception]]):
        filename = options.get('output_file')
        if not filename:
            return

        if len(results) > 0:
            # write the results to file
            with open(filename, 'a') as f:
                lines = []
                for result in results:
                    tx_hash, attestation = result
                    if attestation:  # attestation will be None for txs that were skipped
                        lines.append(
                            f'{tx_hash}, {attestation["risk_score"]}, {attestation["metadata"]}')
                f.write("\n".join(lines))
                f.write("\n")

        if len(errors) > 0:
            # write the errors to file
            with open(f'{filename}-errors', 'a') as f:
                lines = []
                for error in errors:
                    tx_hash_or_block_number, _ = error
                    lines.append(
                        f'{tx_hash_or_block_number}')
                f.write("\n".join(lines))
                f.write("\n")

    return write_attestations_to_file
