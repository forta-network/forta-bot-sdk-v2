import os
from dependency_injector import containers, providers
from .run_attester import provide_run_attester


class AttesterContainer(containers.DeclarativeContainer):
    common = providers.DependenciesContainer()
    transactions = providers.DependenciesContainer()
    traces = providers.DependenciesContainer()
    cli = providers.DependenciesContainer()

    attester_port = providers.Object(
        int(os.environ['ATTESTER_PORT']) if 'ATTESTER_PORT' in os.environ else 3001)
    attester_socket_path = providers.Object(
        os.environ.get("ATTESTER_SOCKET_PATH"))
    run_attester = providers.Callable(provide_run_attester,
                                      attester_port=attester_port,
                                      attester_socket_path=attester_socket_path,
                                      create_transaction_event=transactions.create_transaction_event,
                                      is_running_cli_command=common.is_running_cli_command,
                                      run_attester_cli_command=cli.run_attester_cli_command,
                                      parse_debug_traces_and_logs=traces.parse_debug_traces_and_logs,
                                      logger=common.logger)
