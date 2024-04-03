from dependency_injector import containers, providers
from .create_transaction_event import provide_create_transaction_event
from .get_transaction_receipt import provide_get_transaction_receipt


class TransactionsContainer(containers.DeclarativeContainer):
    common = providers.DependenciesContainer()
    cache = providers.DependenciesContainer()

    create_transaction_event = providers.Callable(
        provide_create_transaction_event)
    get_transaction_receipt = providers.Callable(
        provide_get_transaction_receipt, cache=cache.cache, with_retry=common.with_retry)
