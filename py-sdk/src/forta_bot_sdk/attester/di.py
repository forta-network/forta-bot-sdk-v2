import os
from dependency_injector import containers, providers
from .run_attester import provide_run_attester


class AttesterContainer(containers.DeclarativeContainer):
    common = providers.DependenciesContainer()
    transactions = providers.DependenciesContainer()

    attester_port = providers.Object(
        int(os.environ['ATTESTER_PORT']) if 'ATTESTER_PORT' in os.environ else 3001)
    run_attester = providers.Callable(provide_run_attester,
                                      attester_port=attester_port,
                                      create_transaction_event=transactions.create_transaction_event,
                                      logger=common.logger)
