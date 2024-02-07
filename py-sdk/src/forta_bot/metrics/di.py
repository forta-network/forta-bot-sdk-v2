from dependency_injector import containers, providers
from .metrics_helper import MetricsHelper
from .metrics_manager import MetricsManager


class MetricsContainer(containers.DeclarativeContainer):
  metrics_manager = providers.Singleton(MetricsManager)
  metrics_helper = providers.Singleton(MetricsHelper, metrics_manager=metrics_manager)