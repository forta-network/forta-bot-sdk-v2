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
                                                     create_transaction_event=transactions.create_transaction_event,
                                                     logger=common.logger)
    run_attester_on_block = providers.Callable(provide_run_attester_on_block,
                                               get_block_with_transactions=blocks.get_block_with_transactions,
                                               get_debug_trace_block=traces.get_debug_trace_block,
                                               create_transaction_event=transactions.create_transaction_event,
                                               write_attestations_to_file=common.write_attestations_to_file,
                                               process_work_queue=common.process_work_queue,
                                               logger=common.logger)
