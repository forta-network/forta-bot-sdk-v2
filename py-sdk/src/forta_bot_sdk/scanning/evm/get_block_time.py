from typing import Callable

# returns block time in seconds given a chain id
GetBlockTime = Callable[[int], int]


def provide_get_block_time() -> GetBlockTime:
    def get_block_time(chain_id: int):
        match chain_id:
            case 1:  # eth
                return 12
            case 56:  # bsc
                return 3
            case _:
                return 2

    return get_block_time
