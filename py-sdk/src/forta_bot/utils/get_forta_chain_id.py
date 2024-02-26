from typing import Callable, Optional


# returns the chain id that is injected by the scan node into this bot
GetFortaChainId = Callable[[], Optional[int]]


def provide_get_forta_chain_id(forta_chain_id: Optional[int]):

    def get_forta_chain_id():
        return forta_chain_id

    return get_forta_chain_id
