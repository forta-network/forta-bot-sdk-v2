from dependency_injector import containers, providers
from .get_labels import provide_get_labels


class LabelsContainer(containers.DeclarativeContainer):
    common = providers.DependenciesContainer()

    get_labels = providers.Callable(provide_get_labels,
                                    get_aiohttp_session=common.get_aiohttp_session,
                                    get_forta_api_url=common.get_forta_api_url,
                                    get_forta_api_headers=common.get_forta_api_headers)
