from dependency_injector import containers, providers
from .get_provider import provide_get_provider


class ProvidersContainer(containers.DeclarativeContainer):
    common = providers.DependenciesContainer()
    jwt = providers.DependenciesContainer()
    metrics = providers.DependenciesContainer()

    get_provider = providers.Callable(provide_get_provider,
                                      get_rpc_jwt=jwt.get_rpc_jwt,
                                      decode_jwt=jwt.decode_jwt,
                                      get_chain_id=common.get_chain_id,
                                      get_aiohttp_session=common.get_aiohttp_session,
                                      forta_config=common.forta_config,
                                      metrics_helper=metrics.metrics_helper,
                                      is_prod=common.is_prod)
