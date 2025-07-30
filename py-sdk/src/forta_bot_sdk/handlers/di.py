import os
from dependency_injector import containers, providers
from .run_handlers_on_transaction import provide_run_handlers_on_transaction
from .run_handlers_on_alert import provide_run_handlers_on_alert
from .run_handlers_on_block import provide_run_handlers_on_block
from .run_attester_on_transaction import provide_run_attester_on_transaction
from .run_attester_on_block import provide_run_attester_on_block


class HandlersContainer(containers.DeclarativeContainer):
    common = providers.DependenciesContainer()
    blocks = providers.DependenciesContainer()
    transactions = providers.DependenciesContainer()
    traces = providers.DependenciesContainer()
    logs = providers.DependenciesContainer()
    alerts = providers.DependenciesContainer()
    metrics = providers.DependenciesContainer()

    attestations_flush_limit = providers.Object(int(os.environ.get(
        'FORTA_CLI_ATTESTATION_FLUSH_LIMIT')) if 'FORTA_CLI_ATTESTATION_FLUSH_LIMIT' in os.environ else 500_000)
    run_handlers_on_transaction = providers.Callable(provide_run_handlers_on_transaction,
                                                     get_transaction_receipt=transactions.get_transaction_receipt,
                                                     get_block_with_transactions=blocks.get_block_with_transactions,
                                                     get_trace_data=traces.get_trace_data,
                                                     create_transaction_event=transactions.create_transaction_event,
                                                     logger=common.logger)
    run_handlers_on_block = providers.Callable(provide_run_handlers_on_block,
                                               get_block_with_transactions=blocks.get_block_with_transactions,
                                               get_trace_data=traces.get_trace_data,
                                               get_logs_for_block=logs.get_logs_for_block,
                                               create_block_event=blocks.create_block_event,
                                               create_transaction_event=transactions.create_transaction_event,
                                               metrics_helper=metrics.metrics_helper,
                                               logger=common.logger)
    run_handlers_on_alert = providers.Callable(provide_run_handlers_on_alert,
                                               get_alert=alerts.get_alert,
                                               create_alert_event=alerts.create_alert_event,
                                               metrics_helper=metrics.metrics_helper,
                                               logger=common.logger)
    run_attester_on_transaction = providers.Callable(provide_run_attester_on_transaction,
                                                     get_transaction=transactions.get_transaction,
                                                     get_debug_trace_transaction=traces.get_debug_trace_transaction,
                                                     get_block_with_transactions=blocks.get_block_with_transactions,
                                                     get_transaction_receipt=transactions.get_transaction_receipt,
                                                     create_transaction_event=transactions.create_transaction_event,
                                                     logger=common.logger,
                                                     should_include_tx_receipts=common.should_include_tx_receipts)
    run_attester_on_block = providers.Callable(provide_run_attester_on_block,
                                               get_block_with_transactions=blocks.get_block_with_transactions,
                                               get_debug_trace_block=traces.get_debug_trace_block,
                                               create_transaction_event=transactions.create_transaction_event,
                                               get_transaction_receipt=transactions.get_transaction_receipt,
                                               write_attestations_to_file=common.write_attestations_to_file,
                                               process_work_queue=common.process_work_queue,
                                               logger=common.logger,
                                               attestations_flush_limit=attestations_flush_limit,
                                               should_include_tx_receipts=common.should_include_tx_receipts)
